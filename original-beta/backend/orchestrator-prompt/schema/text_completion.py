from pydantic import BaseModel, Field, field_validator


class TextCompletionPostRequest(BaseModel):
    documentType: str = Field(..., title="文章の種類")
    text: str = Field(..., title="文章")

    @field_validator("documentType", mode="before")
    @classmethod
    def validate_document_type(cls, v):
        if v is None or not v.strip():
            raise ValueError("文章の種類は必須です")
        return v

    @field_validator("text", mode="before")
    @classmethod
    def validate_text(cls, v):
        if v is None or not v.strip():
            raise ValueError("文章内容が空です")
        return v
