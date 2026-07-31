import json
from typing import BinaryIO

import azure.functions as func

from modules.file_prompt import get_file_content


class FileModule:
    def __init__(self, file: BinaryIO):
        file.name
        self.file = file

    def file_name(self) -> str:
        # ファイル名の文字化け対策
        try:
            # 多くのブラウザはiso-8859-1で送るためutf-8に変換
            name = self.file.filename.encode("iso-8859-1").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError, AttributeError):
            # 変換できない場合や属性がない場合はそのまま
            name = self.file.filename
        return name

    def content(self):
        try:
            name: str = self.file_name()
            content: bytes = self.file.read()
            extension: str = name.split(".")[-1]
            content_text = get_file_content(content, extension)
        except ValueError as ve:
            return func.HttpResponse(
                json.dumps({"message": str(ve), "success": False}),
                status_code=400,
                mimetype="application/json",
            )
        return name, content_text, extension
