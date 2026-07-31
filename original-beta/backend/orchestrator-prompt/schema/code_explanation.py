from pydantic import BaseModel, Field, field_validator


class CodeExplanationPostRequest(BaseModel):
    programmingLanguage: str = Field(..., title="プログラミング言語")
    code: str = Field(..., title="コード")

    @field_validator("programmingLanguage", mode="before")
    @classmethod
    def validate_programming_language(cls, v):
        if not v:
            raise ValueError("プログラミング言語または製品名は必須です")
        return v

    @field_validator("code", mode="before")
    @classmethod
    def validate_code(cls, v):
        if not v:
            raise ValueError("コードは必須です")
        return v
