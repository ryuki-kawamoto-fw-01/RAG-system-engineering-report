from typing import Any, List, Dict, Optional
from modules.text.dictionary_methods import dictionary_registration
from modules.model import Media, WordEntry


class UserPrompt:
    def __init__(
        self,
        user_message: str,
        media: Optional[Media] = None,
        word_dictionary: Optional[List[WordEntry]] = None,
    ):
        self.user_message: str = user_message
        self.media: Optional[Media] = media
        self.word_dictionary: Optional[List[WordEntry]] = word_dictionary

    @property
    def processed_text(self) -> str:
        # 辞書から情報を付与する
        prompt = self.user_message
        if self.word_dictionary:
            prompt = dictionary_registration(self.user_message, self.word_dictionary)
        # テキストメディアが添付されている場合は、メッセージに追加
        if self.media and not self.media.image_url:
            if self.media.file_content:
                prompt += f"\n# 添付ファイルの内容\nファイル名：{self.media.file_name}\n{self.media.file_content}"
        return prompt

    @property
    def req_body(self) -> Dict[str, Any]:
        prompt = self.processed_text
        # 画像が添付されている場合は、image_urlを追加
        if self.media and self.media.image_url:
            return {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": self.media.image_url}},
                ],
            }

        return {"role": "user", "content": prompt}
