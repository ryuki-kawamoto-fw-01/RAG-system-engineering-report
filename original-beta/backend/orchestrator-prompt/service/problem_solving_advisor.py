import json
import logging
import re
from urllib.parse import parse_qs

import azure.functions as func

from repository.aoai import AoaiRepository
from system.problem_solving_advisor import get_problem_solving_advisor_system_message


class ProblemSolvingAdvisorService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def form_parser(self):
        content_type = self.request.headers.get("Content-Type", "")
        user_message = ""
        chat_history = []

        if "multipart/form-data" in content_type:
            try:
                form = self.request.form
                user_message = form.get("question", "")
                chat_history_str = form.get("chatHistory", "[]")
                try:
                    chat_history = json.loads(chat_history_str)
                except Exception as e:
                    logging.error(f"chatHistory parse error: {e}")
                    chat_history = []
            except Exception as e:
                logging.error(f"Multipart form parsing error: {e}")
                user_message = ""
                chat_history = []
        elif "application/json" in content_type:
            try:
                data = self.request.get_json()
                user_message = data.get("question", "")
                chat_history = data.get("chatHistory", [])
            except Exception as e:
                logging.error(f"JSON parse error: {e}")
                user_message = ""
                chat_history = []
        elif "application/x-www-form-urlencoded" in content_type:
            try:
                body = self.request.get_body().decode("utf-8")
                form = parse_qs(body)
                user_message = form.get("question", [""])[0]
                chat_history_str = form.get("chatHistory", ["[]"])[0]
                try:
                    chat_history = json.loads(chat_history_str)
                except Exception as e:
                    logging.error(f"chatHistory parse error: {e}")
                    chat_history = []
            except Exception as e:
                logging.error(f"Form-urlencoded parse error: {e}")
                user_message = ""
                chat_history = []
        else:
            user_message = ""
            chat_history = []

        # chatHistoryが配列でない場合は空リストに
        if not isinstance(chat_history, list):
            chat_history = []

        return user_message, chat_history

    def problem_solving_advisor(self):
        try:
            user_message, chat_history = self.form_parser()

            # chatHistoryが配列でない場合は空リストに
            messages = chat_history if isinstance(chat_history, list) else []

            # スキップフラグを初期化
            skip_to_advice = False

            # スキップ指示のメッセージを検出
            skip_message = (
                "【システム: 深掘りをスキップしてそのままアドバイスを出してください】"
            )
            if user_message == skip_message:
                skip_to_advice = True
                # 直前のユーザーメッセージを取得
                last_user_message = next(
                    (
                        m.get("content", "")
                        for m in reversed(messages)
                        if m.get("role") == "user"
                    ),
                    "",
                )
                # スキップメッセージを前回の実際の質問で置き換え
                user_message = last_user_message or "アドバイスをお願いします"
                logging.info(
                    f"Skip to advice mode detected. Using message: {user_message}"
                )

            # ユーザー発言数（深掘り回数）をカウント
            turn_count = sum(1 for m in messages if m.get("role") == "user")

            # デバッグログ追加
            logging.info(f"Turn count: {turn_count}, Skip to advice: {skip_to_advice}")

            # 条件に応じてプロンプト選択（スキップモードの場合は強制的に5を設定）
            effective_turn_count = 5 if skip_to_advice else turn_count

            # 回数に応じてプロンプトを切り替え
            messages.append(
                {
                    "role": "system",
                    "content": get_problem_solving_advisor_system_message(
                        effective_turn_count
                    ),
                }
            )
            messages.append({"role": "user", "content": user_message})

            answer = self.repository.create_aoai_answer(messages)

            # 先頭200文字だけログ出力
            logging.info(f"Raw answer from LLM: {answer[:200]}...")

            # 5回目以降またはスキップモードの場合はまとめ表示
            if turn_count >= 5 or skip_to_advice:
                # 各セクションを抽出
                logic_tree = ""
                advice = ""
                summary = ""

                # 区切り文字方式での抽出
                logic_match = re.search(
                    r"\[LOGIC_TREE_START\](.*?)\[LOGIC_TREE_END\]", answer, re.DOTALL
                )
                if logic_match:
                    logic_tree = logic_match.group(1).strip()
                    logging.info("Logic tree extracted successfully")

                advice_match = re.search(
                    r"\[ADVICE_START\](.*?)\[ADVICE_END\]", answer, re.DOTALL
                )
                if advice_match:
                    advice = advice_match.group(1).strip()
                    logging.info("Advice extracted successfully")

                summary_match = re.search(
                    r"\[SUMMARY_START\](.*?)\[SUMMARY_END\]", answer, re.DOTALL
                )
                if summary_match:
                    summary = summary_match.group(1).strip()
                    logging.info("Summary extracted successfully")

                # マークダウン形式でのフォールバック抽出
                if not logic_tree:
                    logic_match = re.search(
                        r"## ロジックツリー\s*(.*?)(?=##|\Z)", answer, re.DOTALL
                    )
                    if logic_match:
                        logic_tree = logic_match.group(1).strip()
                        logging.info("Logic tree extracted from markdown")

                if not advice:
                    advice_match = re.search(
                        r"## アドバイス\s*(.*?)(?=##|\Z)", answer, re.DOTALL
                    )
                    if advice_match:
                        advice = advice_match.group(1).strip()
                        logging.info("Advice extracted from markdown")

                if not summary:
                    summary_match = re.search(
                        r"## まとめ\s*(.*?)(?=##|\Z)", answer, re.DOTALL
                    )
                    if summary_match:
                        summary = summary_match.group(1).strip()
                        logging.info("Summary extracted from markdown")

                return {
                    "success": True,
                    "data": {
                        "content": answer,
                        "isSummary": True,
                        "logicTree": logic_tree or "データ構造の抽出に失敗しました",
                        "advice": advice or "データ構造の抽出に失敗しました",
                        "summary": summary or "データ構造の抽出に失敗しました",
                    },
                }
            else:
                return {
                    "success": True,
                    "data": {
                        "content": answer,
                        "isSummary": False,
                    },
                }
        except Exception as e:
            logging.error(f"Error in problem_solving_advisor: {e}", exc_info=True)
            return {"success": False, "message": str(e)}
