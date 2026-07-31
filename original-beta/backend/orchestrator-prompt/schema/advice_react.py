from pydantic import BaseModel, Field, field_validator


class AdviceReactPostRequest(BaseModel):
    adviceInput: str = Field(..., title="アドバイスをもらいたいこと")

    @field_validator("adviceInput", mode="before")
    @classmethod
    def validate_adviceInput(cls, v):
        if v is None:
            raise ValueError("adviceInputは必須です")
        return v
