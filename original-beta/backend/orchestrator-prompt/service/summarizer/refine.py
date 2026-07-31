# service/summarizer/refine.py

from typing import List
from service.summarizer.base_summarizer import BaseSummarizer

# 仮のOpenAI呼び出し
def create_aoai_answer(prompt: str) -> str:
    return f"[Refine AI Answer] {prompt[:30]}..."

class RefineSummarizer(BaseSummarizer):
    """
    Refine方式。
    1) 先頭チャンクをざっくり要約
    2) 残りチャンクを追加で反映しつつ要約を洗練
    """

    def summarize(self, text: str) -> str:
        chunks = self.chunk_text(text)
        if not chunks:
            return ""

        # 1) 最初のチャンクで初回要約
        current_summary = self._summarize_chunk(chunks[0])

        # 2) 残りのチャンクを段階的に追加
        for c in chunks[1:]:
            current_summary = self._refine_summary(current_summary, c)

        # 3) summary_mode仕上げ
        if self.summary_mode == "short":
            return self._shortify(current_summary)
        elif self.summary_mode.startswith("sentence"):
            return self._limit_sentences(current_summary)
        else:
            return current_summary

    def _summarize_chunk(self, chunk_text: str) -> str:
        prompt = f"【チャンク要約(Refine)】\n{chunk_text}\n{self.add_prompt}"
        return create_aoai_answer(prompt)

    def _refine_summary(self, current_summary: str, new_chunk: str) -> str:
        """
        既存のサマリに新チャンクの情報を組み込む。
        """
        prompt = (
            f"【現在の要約】\n{current_summary}\n\n"
            f"【新しいテキスト】\n{new_chunk}\n"
            f"{self.add_prompt}\n"
            "これを踏まえて要約を更新（Refine）してください。"
        )
        return create_aoai_answer(prompt)

    def _shortify(self, text: str) -> str:
        return f"[Short-Refine] {text[:50]}..."

    def _limit_sentences(self, text: str) -> str:
        import re
        num_str = self.summary_mode.replace("sentence", "")
        try:
            limit = int(num_str)
        except:
            limit = 3
        sentences = re.split(r'[。\.]', text)
        limited = "。".join(sentences[:limit])
        return f"{limited}。"