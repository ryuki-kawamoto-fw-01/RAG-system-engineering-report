from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator, model_validator


@dataclass
class Keyframe:
    """キーフレーム情報を表すデータクラス"""

    url: str
    name: str
    frameIdx: int


@dataclass
class ManualStep:
    """マニュアルのステップを表すデータクラス"""

    id: int
    frameIdx: int
    description: str


@dataclass
class UpdateManualRequest:
    """マニュアル更新リクエストを表すデータクラス"""

    manual_id: str
    steps: List[ManualStep]
    frame_urls: List[str]
    container_name: Optional[str] = None
    folder_path: Optional[str] = None
    blob_folder_name: Optional[str] = None
    llm_output_url: Optional[str] = None
    word_file_url: Optional[str] = None
    markdown_file_url: Optional[str] = None
    excel_file_url: Optional[str] = None


@dataclass
class UpdateManualResponse:
    """マニュアル更新レスポンスを表すデータクラス"""

    success: bool
    message: str
    steps: Optional[List[ManualStep]] = None


@dataclass
class ErrorResponse:
    """エラーレスポンスを表すデータクラス"""

    success: bool
    error: str
    message: str


@dataclass
class EditingData:
    """編集画面用データを表すデータクラス"""

    steps: List[ManualStep]
    frameUrls: List[str]
    totalFrames: int
    manualId: str


@dataclass
class ExtractEditingDataRequest:
    """編集データ抽出リクエストを表すデータクラス"""

    llmOutputUrl: str
    containerName: str
    folderPath: str


@dataclass
class ExtractEditingDataResponse:
    """編集データ抽出レスポンスを表すデータクラス"""

    success: bool
    message: str
    data: Optional[EditingData] = None


class CreateManualRequest(BaseModel):
    """create_manual の入力バリデーション用モデル"""

    model_config = ConfigDict(extra="ignore")

    correlation_id: Optional[str] = None
    url: str = ""
    similarity_threshold: float = -2.0
    is_auto_threshold: bool = True

    @field_validator("url")
    @classmethod
    def _url_required(cls, value: str) -> str:
        if not value:
            raise ValueError("URL parameter is required")
        return value

    @model_validator(mode="after")
    def _validate_thresholds(self) -> "CreateManualRequest":
        if self.is_auto_threshold and (0.0 <= self.similarity_threshold <= 1.0):
            raise ValueError(
                "When is_auto_threshold is True, similarity_threshold must not be between 0 and 1."
            )

        if (not self.is_auto_threshold) and (
            self.similarity_threshold < 0.0 or self.similarity_threshold > 1.0
        ):
            raise ValueError(
                "When is_auto_threshold is False, similarity_threshold must be between 0 and 1."
            )

        return self


class ManualStepInput(BaseModel):
    """ステップ入力用バリデーションモデル"""

    model_config = ConfigDict(extra="ignore")

    id: int
    frameIdx: int
    description: str

    @field_validator("id")
    @classmethod
    def _id_positive(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("steps[].idは正の整数である必要があります")
        return value

    @field_validator("frameIdx")
    @classmethod
    def _frame_idx_non_negative(cls, value: int) -> int:
        if value < 0:
            raise ValueError("steps[].frameIdxは0以上の整数である必要があります")
        return value

    @field_validator("description")
    @classmethod
    def _description_required(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("steps[].descriptionは必須です")
        return value.strip()


class SaveManualRequest(BaseModel):
    """save_manual の入力バリデーション用モデル"""

    model_config = ConfigDict(extra="ignore")

    manualId: str = ""
    steps: List[ManualStepInput] = Field(default_factory=list)
    frameUrls: List[str] = Field(default_factory=list)
    containerName: Optional[str] = None
    folderPath: Optional[str] = None
    blobFolderName: Optional[str] = None
    llmOutputUrl: Optional[str] = None
    wordFileURL: Optional[str] = None
    markdownFileURL: Optional[str] = None
    excelFileURL: Optional[str] = None

    @model_validator(mode="after")
    def _validate_required(self) -> "SaveManualRequest":
        if not self.manualId or not self.steps:
            raise ValueError("manualIdとstepsは必須です")
        return self


def first_validation_error_message(error: ValidationError) -> str:
    """Pydantic ValidationError から最初のメッセージを抽出"""

    try:
        details = error.errors()
        if details:
            return details[0].get("msg", "Validation error")
    except Exception:
        pass
    return "Validation error"


# ====================
# Content Understanding API Result Types
# ====================


class SegmentObject(BaseModel):
    """Content Understanding の Segment オブジェクトの型定義"""

    model_config = ConfigDict(extra="allow")

    SegmentId: str
    procedure: str
    StartTimeMs: int
    EndTimeMs: int
    Description: str


class FieldValue(BaseModel):
    """Content Understanding の Field 値の型定義"""

    model_config = ConfigDict(extra="allow")

    type: str
    valueArray: Optional[List[Dict[str, Any]]] = None
    valueString: Optional[str] = None
    valueInteger: Optional[int] = None
    valueObject: Optional[Dict[str, Any]] = None


class ContentSegment(BaseModel):
    """Content Understanding の Content 内セグメントの型定義"""

    model_config = ConfigDict(extra="allow")

    startTimeMs: int
    endTimeMs: int
    description: str
    segmentId: str


class Content(BaseModel):
    """Content Understanding の Content の型定義"""

    model_config = ConfigDict(extra="allow")

    markdown: str
    fields: Dict[str, Any]
    kind: Optional[str] = ""
    startTimeMs: Optional[int] = 0
    endTimeMs: Optional[int] = 0
    width: Optional[int] = 0
    height: Optional[int] = 0
    KeyFrameTimesMs: Optional[List[int]] = Field(default_factory=list)
    segments: Optional[List[ContentSegment]] = Field(default_factory=list)


class TokenUsage(BaseModel):
    """Content Understanding の Token Usage の型定義"""

    model_config = ConfigDict(extra="allow")

    contextualization: float = Field(alias="contextualization")
    gpt_4o_input: int = Field(alias="gpt-4o-input")
    gpt_4o_output: int = Field(alias="gpt-4o-output")


class Usage(BaseModel):
    """Content Understanding の Usage の型定義"""

    model_config = ConfigDict(extra="allow")

    videoHours: float
    tokens: TokenUsage


class ContentUnderstandingResult(BaseModel):
    """Content Understanding API の result フィールドの型定義"""

    model_config = ConfigDict(extra="allow")

    analyzerId: str
    apiVersion: str
    createdAt: str
    stringEncoding: str
    warnings: List[Any]
    contents: List[Content]


class ContentUnderstandingResponse(BaseModel):
    """Content Understanding API の完全なレスポンスの型定義"""

    model_config = ConfigDict(extra="allow")

    id: str
    status: str
    result: ContentUnderstandingResult
    usage: Usage


class SegmentTranscriptData(BaseModel):
    """セグメントのトランスクリプト、フィールド、キーフレームデータの型定義"""

    model_config = ConfigDict(extra="allow")

    transcript: List[str]
    fields: str
    keyframes: List[str]
    keyframe: str
