from typing import Iterable

from openai.types.chat.chat_completion_message_param import ChatCompletionMessageParam


def convert_chat_history_to_string(
    chat_history: Iterable[ChatCompletionMessageParam],
) -> str:
    """
    チャット履歴をフォーマット済みの文字列に変換する関数

    Args:
        chat_history (Iterable[ChatCompletionMessageParam]): チャット履歴のリスト。各要素は {'role': str, 'content': str} の形式

    Returns:
        str: フォーマットされたチャット履歴の文字列
    """
    # チャット履歴が空の場合は空文字を返す
    if not chat_history:
        return ""

    # チャット履歴を文字列に変換
    formatted_history = []
    for message in chat_history:
        role = message["role"]
        if role == "user" or role == "assistant":
            content = message.get("content")
            role = "ユーザー" if role == "user" else "アシスタント"
            if isinstance(content, list):
                content_list = []
                for item in content:
                    if item["type"] == "text":
                        content_list.append(item["text"])
                    elif item["type"] == "image_url":
                        content_list.append(" img_url:" + item["image_url"]["url"])
                print(content_list)
                newContent = "\n".join(content_list)
                formatted_history.append(f"{role}: {newContent}")
            else:
                formatted_history.append(f"{role}: {content}")

    # 改行で結合して返す
    print(formatted_history)
    return "\n".join(formatted_history)


if __name__ == "__main__":
    chat_history: Iterable[ChatCompletionMessageParam] = [
        {"role": "user", "content": "こんにちは"},
        {"role": "assistant", "content": "こんにちは"},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "テスト"},
                {"type": "image_url", "image_url": {"url": "url"}},
            ],
        },
    ]
    print(convert_chat_history_to_string(chat_history))
