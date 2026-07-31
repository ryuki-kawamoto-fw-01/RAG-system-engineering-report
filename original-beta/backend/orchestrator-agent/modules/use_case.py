import json
import logging
import os
from typing import Any, Callable, Dict, List, Optional, Set

from azure.ai.agents.models import FunctionTool, ToolSet
from azure.ai.inference.models import ChatCompletionsToolCall

from modules.agent.prompt import (
    JUDGE_RESEARCH_PROMPT_TEMPLATE,
    RESEARCH_ANSWER_PROMPT_TEMPLATE,
)
from modules.entity import UserPrompt
from modules.model import (
    MergeUseCaseData,
    PdfToImagePromptUseCaseData,
    PlanningUseCaseData,
    ReflectionUseCaseData,
    ToolCall,
    ToolUseUseCaseData,
)
from modules.service import ILLMService, IStorageService, IWordDictionaryService
from modules.text.remove_markdown_links import remove_markdown_links


def generate_plan_desc(tool_calls: List[ToolCall]) -> str:
    plan_desc = "\n".join(["- " + json.loads(x["function"]["arguments"])["desc"] for x in tool_calls])
    return plan_desc


class PlanningUseCase:
    def __init__(
        self,
        llm: ILLMService,
        storage: IStorageService,
        word_dictionary_db: IWordDictionaryService,
        user_functions: Set[Callable],
        system_prompt: str,
    ):
        self.llm: ILLMService = llm
        self.storage: IStorageService = storage
        self.word_dictionary_db: IWordDictionaryService = word_dictionary_db
        self.user_functions: Set[Callable] = user_functions
        self.system_prompt: str = system_prompt

    def execute(
        self,
        question: str,
        messages: List[Dict[str, Any]],
        file_name: Optional[str],
        media_type: Optional[str],
        file_url: Optional[str] = None,
    ) -> PlanningUseCaseData:
        media = None
        if file_name and media_type:
            # file_urlが指定されている場合はURLから、そうでない場合は従来のfetch_media
            if file_url:
                media = self.storage.fetch_media_from_url(file_url, media_type)
            else:
                media = self.storage.fetch_media(file_name, media_type)

        # 初回のメッセージの場合は、システムプロンプトを入力
        if not messages:
            system_message = {"role": "system", "content": self.system_prompt}
            messages = [system_message]

        word_dictionary = self.word_dictionary_db.get_words()

        # 入力した質問からプロンプトを作成する
        prompt = UserPrompt(question, media, word_dictionary)
        logging.info(f"前処理後のプロンプト: {prompt.processed_text}")
        messages.append(prompt.req_body)
        
        # 画像がある場合、先にLLMに画像の内容説明を生成させる
        image_description = None
        if media and media.image_url:
            image_description = self._extract_image_description(messages)
            logging.info(f"画像の内容説明: {image_description}")
        
        toolset = ToolSet()
        toolset.add(FunctionTool(self.user_functions))
        response = self.llm.chat(messages, toolset=toolset, retries=5)
        # 実行するツールの情報
        tool_calls = response["tool_calls"]
        content = response.get("content")
        # 実行するツールの説明を取得
        plan_desc = generate_plan_desc(tool_calls)
        
        # フロントエンドに返すmessagesから画像データを削除（1MB制限対策）
        # 画像の内容はimage_descriptionとしてテキスト化して保存
        messages_for_response = self._remove_image_data(messages, image_description)
        
        return {
            "plan": tool_calls,
            "messages": messages_for_response,
            "user_message_rev": prompt.processed_text,
            "desc": plan_desc,
            "content": content,
        }

    def _extract_image_description(self, messages: List[Dict[str, Any]]) -> str:
        """
        画像の内容をLLMに説明させる
        後続処理で画像コンテキストが必要な場合に備えてテキスト化
        """
        description_prompt = [{
            "role": "system",
            "content": "あなたは画像の内容を詳細に説明するアシスタントです。"
        }]
        
        # 最後のユーザーメッセージ（画像を含む）を取得
        user_message = None
        for msg in reversed(messages):
            if msg.get("role") == "user":
                user_message = msg
                break
        
        if user_message:
            description_prompt.append({
                "role": "user",
                "content": user_message.get("content", []) if isinstance(user_message.get("content"), list) else [{"type": "text", "text": "この画像の内容を詳しく説明してください。"}]
            })
            description_prompt.append({
                "role": "user", 
                "content": "この画像に含まれる重要な情報（テキスト、数値、図表、製品情報など）を詳細に説明してください。後で検索や分析に使用するため、できるだけ具体的に記述してください。"
            })
        
        try:
            response = self.llm.chat(description_prompt, retries=3)
            return response.get("content", "画像の内容を取得できませんでした")
        except Exception as e:
            logging.error(f"画像説明の抽出に失敗: {str(e)}")
            return "画像の内容を取得できませんでした"

    def _remove_image_data(self, messages: List[Dict[str, Any]], image_description: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        messagesから画像のbase64データを削除（Server Actionsの1MB制限対策）
        画像の内容はimage_descriptionとしてテキスト化して保存
        """
        cleaned_messages = []
        for message in messages:
            cleaned_message = message.copy()
            content = message.get("content")
            
            # contentがリスト形式の場合（画像を含む可能性）
            if isinstance(content, list):
                has_text = False
                text_parts = []
                
                for item in content:
                    if item.get("type") == "text":
                        has_text = True
                        text_parts.append(item["text"])
                    elif item.get("type") == "image_url":
                        # 画像は削除するが、説明文があればそれを追加
                        pass
                
                # テキスト部分を結合し、画像説明を追加
                combined_text = "\n".join(text_parts) if text_parts else ""
                
                if image_description:
                    # 画像の内容説明を追加
                    cleaned_message["content"] = f"{combined_text}\n\n【添付画像の内容】\n{image_description}"
                else:
                    # 説明がない場合はプレースホルダーのみ
                    cleaned_message["content"] = f"{combined_text}\n[画像が添付されました]" if combined_text else "[画像が添付されました]"
            
            cleaned_messages.append(cleaned_message)
        return cleaned_messages


class ToolUseUseCase:
    def __init__(
        self,
        user_functions: Set[Callable],
    ):
        self.user_functions: Set[Callable] = user_functions

    def execute(self, messages: List[Dict[str, Any]], tool_calls: List[ChatCompletionsToolCall]) -> ToolUseUseCaseData:
        toolset = ToolSet()
        toolset.add(FunctionTool(self.user_functions))
        tool_outputs = toolset.execute_tool_calls(tool_calls)
        if len(tool_calls) != len(tool_outputs):
            raise Exception("ツール呼び出しに失敗しました")

        tool_calls_dict = [t.as_dict() for t in tool_calls]

        assistant_message = {"role": "assistant", "content": ""}
        if tool_calls_dict:
            assistant_message["tool_calls"] = tool_calls_dict
        messages.append(assistant_message)

        for result in tool_outputs:
            tool_message = {
                "role": "tool",
                "tool_call_id": result["tool_call_id"],
                "content": result["output"],
            }
            messages.append(tool_message)

        return {"messages": messages, "tool_outputs": tool_outputs}


class ReflectionUseCase:
    def __init__(
        self,
        llm: ILLMService,
        user_functions: Set[Callable],
    ):
        self.llm: ILLMService = llm
        self.user_functions: Set[Callable] = user_functions

    def execute(self, messages: List[Dict[str, Any]], user_message_rev: str) -> ReflectionUseCaseData:
        messages.append(
            {
                "role": "user",
                "content": JUDGE_RESEARCH_PROMPT_TEMPLATE.format(question=user_message_rev),
            }
        )

        toolset = ToolSet()
        toolset.add(FunctionTool(self.user_functions))

        # LLMで再度ツールを実行する必要性を判断
        response = self.llm.chat(messages, toolset=toolset, retries=5)

        tool_calls = response.get("tool_calls")
        complete = len(tool_calls) == 0

        if not complete:
            plan_desc = generate_plan_desc(tool_calls)
            tool_calls = [t for t in tool_calls]
        else:
            plan_desc = "最終回答を作成します。"
            tool_calls = []

        return {
            "messages": messages,
            "complete": complete,
            "tool_calls": tool_calls,
            "desc": plan_desc,
        }


class MergeUseCase:
    def __init__(
        self,
        llm: ILLMService,
    ):
        self.llm: ILLMService = llm

    def execute(self, messages: List[Dict[str, Any]], user_message_rev: str) -> MergeUseCaseData:
        user_message = {
            "role": "user",
            "content": RESEARCH_ANSWER_PROMPT_TEMPLATE.format(question=user_message_rev),
        }
        messages.append(user_message)
        response = self.llm.chat(messages, retries=5)
        answer = response["content"]
        answer = remove_markdown_links(answer)
        return {"messages": messages, "answer": answer if answer else ""}


class PdfToImagePromptUseCase:
    def __init__(
        self,
        storage: IStorageService,
    ):
        self.storage: IStorageService = storage

    def execute(
        self, messages: List[Dict[str, Any]], tool_outputs: List[Dict[str, Any]]
    ) -> PdfToImagePromptUseCaseData:
        """
        PDFファイルをツール出力から抽出し、画像として会話メッセージに追加する

        Args:
            messages: 会話メッセージのリスト
            tool_outputs: ツール実行からの出力

        Returns:
            Dict[str, Any]: PDFイメージを含む更新されたメッセージ
        """
        updated_messages = messages.copy()
        for tool_output in tool_outputs:
            try:
                segments = json.loads(tool_output["output"])["segments"]
                for segment in segments:
                    for citation in segment["citation"]:
                        try:
                            file_path = citation["split_file_path"]
                            if file_path and os.path.splitext(file_path)[1].lower() == ".pdf":
                                media = self.storage.fetch_media(file_path, "pdf")
                                user_prompt = UserPrompt(
                                    f"{file_path}の読み取り画像",
                                    media,
                                )
                                updated_messages.append(user_prompt.req_body)
                                logging.info(f"PDFファイル {file_path} を画像としてメッセージに追加しました")
                        except Exception as e:
                            logging.error(f"引用の処理中にエラーが発生しました {citation}: {str(e)}")
                            continue
            except Exception as e:
                logging.error(f"ツール出力の処理中にエラーが発生しました: {str(e)}")
                continue

        return {"messages": updated_messages, "tool_outputs": tool_outputs}
