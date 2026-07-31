import base64
import chardet
from . import media_types
from typing import Optional, Tuple


class FileParser:

    def __init__(self, chardet_confidence, logging):
        self.chardet_confidence = chardet_confidence
        self.logging = logging

    def _detect_file_ext(self, filepath: str) -> Optional[str]:
        if "." not in filepath:
            self.logging.error(f"Extentention is not detected. {filepath}")
            return None
        return filepath.split(".")[-1].lower()

    def _detect_file_charcode(self, content: bytes) -> Tuple[str, float]:
        result = chardet.detect(content)
        encoding = result["encoding"]
        encoding = "utf-8" if encoding is None else encoding
        confidence = result["confidence"]
        return (encoding, confidence)

    def _force_encode(self, content: bytes) -> Optional[str]:
        for c in ["utf-8", "SJIS"]:
            try:
                content_text = content.decode(c, errors="replace")
                return content_text
            except Exception as e:
                self.logging.error(f"UnicodeDecodeError with {c}: {e}")

    def _parse_txt(self, content: bytes) -> Optional[str]:
        encoding, confidence = self._detect_file_charcode(content)
        if confidence > self.chardet_confidence and encoding is not None:
            try:
                return content.decode(encoding)
            except UnicodeDecodeError:
                return self._force_encode(content)
        else:
            return self._force_encode(content)

    def _parse_file(self, content: bytes) -> Optional[str]:
        content_to_send = base64.b64encode(content).decode("utf-8")
        return content_to_send

    def file_to_content(
        self, filepath: str, content: bytes
    ) -> Tuple[Optional[str], Optional[str]]:
        ext = self._detect_file_ext(filepath)
        if ext == "txt":
            return self._parse_file(content), media_types.txt
        elif ext == "csv":
            return self._parse_txt(content), media_types.csv
        elif ext == "pdf":
            return self._parse_file(content), media_types.pdf
        elif ext == "pptx":
            return self._parse_file(content), media_types.powerpoint
        elif ext == "xlsx":
            return self._parse_file(content), media_types.excel
        elif ext == "docx":
            return self._parse_file(content), media_types.word
        self.logging.error(f"{ext} is not supported extentison")
        return None, None
