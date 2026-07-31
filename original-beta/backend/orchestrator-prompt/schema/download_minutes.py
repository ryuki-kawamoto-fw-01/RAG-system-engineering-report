from pydantic import BaseModel, Field, field_validator


class DownloadMinutesPostRequest(BaseModel):
    result_minutes: str = Field(title="作成された議事録")

    @field_validator("result_minutes", mode="before")
    @classmethod
    def validate_result_minutes(cls, v):
        if v is None:
            raise ValueError("作成結果は必須です")
        return v
