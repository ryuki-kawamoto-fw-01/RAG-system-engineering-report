# service/summarizer/map_rerank.py

from typing import List
from service.summarizer.base_summarizer import BaseSummarizer

# 仮の呼び出し関数。（例: OpenAI APIラッパ）
def create_aoai_answer(prompt: str) -> str:
    # 実際には repository/aoai.py などにある関数を呼び出す想定
    return f"[MapRerank AI Answer] {prompt[:30]}..."

class MapRerankSummarizer(BaseSummarizer):
    """
    MapRerank方式の要約。
    1) Chunking (Map) -> 各チャンク要約
    2) 複数要約をRerank/Reduceして最終要約
    """

    def summarize(self, text: str) -> str:
        # 1) チャンク分割
        chunks = self.chunk_text(text, chunk_size=1000)
        if not chunks:
            return ""

        # 2) 各チャンクを要約 (Mapステップ)
        chunk_summaries = []
        for c in chunks:
            chunk_summary = self._summarize_chunk(c)
            chunk_summaries.append(chunk_summary)

        # 3) Rerank/Reduce
        final_summary = self._reduce_rerank(chunk_summaries)

        # 4) summary_modeに応じた仕上げ（例）
        if self.summary_mode == "short":
            return self._shortify(final_summary)
        elif self.summary_mode.startswith("sentence"):
            return self._limit_sentences(final_summary)
        else:
            return final_summary

    def _summarize_chunk(self, chunk_text: str) -> str:
        """
        単一チャンクの要約処理。Mapステップのイメージ。
        """
        prompt = f"【チャンク要約】\n{chunk_text}\n{self.add_prompt}"
        return create_aoai_answer(prompt)

    def _reduce_rerank(self, chunk_summaries: List[str]) -> str:
        """
        Rerank/Reduceステップ。とりあえず再度まとめ要約する処理。
        """
        joined_summaries = "\n".join(chunk_summaries)
        prompt = f"以下の要約群を踏まえて、全体要約を作成:\n{joined_summaries}\n{self.add_prompt}"
        return create_aoai_answer(prompt)

    def _shortify(self, text: str) -> str:
        """
        shortモード用の仕上げ例。実際にはOpenAIに再度投げることが多い。
        """
        return f"[Short] {text[:50]}..."

    def _limit_sentences(self, text: str) -> str:
        """
        'sentence3' などで文数制限する例。（簡易的実装）
        """
        import re
        num_str = self.summary_mode.replace("sentence", "")
        try:
            limit = int(num_str)
        except:
            limit = 3
        # 簡易分割: ピリオドでsplitして先頭n文を返す
        sentences = re.split(r'[。\.]', text)
        limited = "。".join(sentences[:limit])
        return f"{limited}。"