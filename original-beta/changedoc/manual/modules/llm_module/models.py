"""Data / Pydantic models and configuration dataclasses."""

from collections.abc import Callable
from dataclasses import dataclass

from pydantic import BaseModel


class UrlRequest(BaseModel):
    url: str
    similarity_threshold: float = -2.0  # -2.0 auto / else 0.0 - 1.0


class ImageSimilarityJudgementResponseContent(BaseModel):
    """画像の類似度判定に関するレスポンス"""

    image1_step: list[str]
    image2_step: list[str]
    diff: list[str]
    reason: str
    result: str
    answer: str


class ProcedureResponseContent(BaseModel):
    """手順書生成に関するレスポンス"""

    text_candidates: list[str]
    image_candidates: list[str]
    reason: str
    candidates: list[str]
    self_reflection: str
    answer: str


class ManualStepContent(BaseModel):
    """マニュアルステップの内容"""
    index: int
    description: str
    skip: bool = False  # マニュアルから省くフラグ
    skip_reason: str = ""  # スキップ理由（重複、不要など）


class KeyframesManualResponseContent(BaseModel):
    """キーフレーム画像群からのマニュアル生成レスポンス"""
    steps: list[ManualStepContent]


@dataclass(frozen=True, kw_only=True)
class Settings:
    endpoint: str
    api_version: str
    subscription_key: str | None = None  # APIキー (任意)
    aad_token: str | None = None  # Managed Identity トークン (任意)
    analyzer_id: str

    def __post_init__(self):  # type: ignore[override]
        # Managed Identity 利用時は subscription_key / aad_token 未設定からの動的取得を許容するためバリデーション緩和
        pass

    @property
    def token_provider(self) -> Callable[[], str] | None:  # noqa: D401
        aad_token = self.aad_token
        if aad_token is None:
            return None
        return lambda: aad_token
