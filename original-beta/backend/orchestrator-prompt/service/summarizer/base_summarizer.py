# service/summarizer/base_summarizer.py

from abc import ABC, abstractmethod
from typing import List

class BaseSummarizer(ABC):
    """
    要約クラスの抽象基底クラス。共通のインターフェイスと
    Chunking・Reduceステップなどの基本メソッドを持たせることを想定。
    """

    def __init__(self, summary_mode: str = "short", add_prompt: str = ""):
        self.summary_mode = summary_mode
        self.add_prompt = add_prompt

    @abstractmethod
    def summarize(self, text: str) -> str:
        """
        メインの要約メソッド。文章全体を要約し、その結果を返す。
        具象クラスで実装してください。
        """
        pass

    def chunk_text(self, text: str, chunk_size: int = 1000) -> List[str]:
        """
        シンプルな文字数ベースのチャンク分割。実運用では句点や改行で
        切るなど工夫すると精度が上がります。
        """
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunks.append(text[start:end])
            start = end
        return chunks

    def reduce_summaries(self, chunk_summaries: List[str]) -> str:
        """
        複数チャンクの要約結果を統合するデフォルト実装。
        サブクラスでオーバーライドしてもOK。
        """
        # ここではとりあえず全部つなぐだけ
        return "\n".join(chunk_summaries)