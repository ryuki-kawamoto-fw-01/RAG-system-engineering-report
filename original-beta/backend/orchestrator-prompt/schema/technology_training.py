from typing import Optional

from pydantic import BaseModel, Field, field_validator


class TechnologyTrainingPostRequest(BaseModel):
    technology: str = Field(..., title="学習したい技術")
    learningLevel: str = Field(..., title="学習レベル")
    studyTime: int = Field(..., title="学習時間")
    consideration: Optional[str] = Field(..., title="考慮事項")

    @field_validator("technology", mode="before")
    @classmethod
    def validate_technology(cls, v):
        if v is None:
            raise ValueError("technologyは必須です")
        return v

    @field_validator("learningLevel", mode="before")
    @classmethod
    def validate_learning_level(cls, v):
        if v is None:
            raise ValueError("learning_levelは必須です")
        return v

    @field_validator("studyTime", mode="before")
    @classmethod
    def validate_study_time(cls, v):
        if v is None:
            raise ValueError("study_timeは必須です")
        return v


class FixTrainingPostRequest(BaseModel):
    result: str = Field(..., title="作成結果")
    fixTrainingRequest: str = Field(..., title="修正事項")

    @field_validator("result", mode="before")
    @classmethod
    def validate_result(cls, v):
        if v is None:
            raise ValueError("resultは必須です")
        return v

    @field_validator("fixTrainingRequest", mode="before")
    @classmethod
    def validate_fix_training_request(cls, v):
        if v is None:
            raise ValueError("fix_training_requestは必須です")
        return v
