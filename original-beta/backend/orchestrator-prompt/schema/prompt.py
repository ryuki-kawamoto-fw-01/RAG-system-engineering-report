from pydantic import BaseModel, Field, field_validator


class CreatePromptPostRequestBody(BaseModel):
    originalPrompt: str = Field(..., title="プロンプトテンプレートを作成")

    @field_validator("originalPrompt", mode="before")
    @classmethod
    def validate_original_prompt(cls, v):
        if v is None:
            raise ValueError("original_promptは必須です")
        return v


class FixPromptPostRequest(BaseModel):
    revisionPrompt: str = Field(..., title="修正プロンプトテンプレート")
    enhancedPrompt: str = Field(..., title="既存のプロンプトテンプレート")

    @field_validator("revisionPrompt", mode="before")
    @classmethod
    def validate_revision_prompt(cls, v):
        if v is None:
            raise ValueError("revision_promptは必須です")
        return v

    @field_validator("enhancedPrompt", mode="before")
    @classmethod
    def validate_enhanced_text(cls, v):
        if v is None:
            raise ValueError("enhanced_textは必須です")
        return v
