from typing import Dict, List

from azure.ai.inference.models import (
    AssistantMessage,
    ChatCompletionsToolCall,
    ChatRequestMessage,
    SystemMessage,
    ToolMessage,
    UserMessage,
)


def parse_messages(messages_json: List[Dict]) -> List[ChatRequestMessage]:
    messages = []
    for message in messages_json:
        params = {k: v for k, v in message.items() if k != "role"}
        if message.get("role") == "system":
            messages.append(SystemMessage(**params))
        elif message.get("role") == "user":
            messages.append(UserMessage(**params))
        elif message.get("role") == "assistant":
            # tool_callsが空配列の場合は削除
            if "tool_calls" in params and not params["tool_calls"]:
                del params["tool_calls"]
            messages.append(AssistantMessage(**params))
        elif message.get("role") == "tool":
            messages.append(ToolMessage(**params))
    return messages


def dump_messages(messages: List[ChatRequestMessage]) -> List[Dict]:
    return [msg.as_dict() for msg in messages]
