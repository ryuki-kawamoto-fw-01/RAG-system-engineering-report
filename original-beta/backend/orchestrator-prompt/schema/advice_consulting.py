from pydantic import BaseModel, Field, field_validator


class AdviceConsultingPostRequest(BaseModel):
    role: str = Field(..., title="役割")
    constraints: str = Field(..., title="制約条件")
    adviceInput: str = Field(..., title="アドバイスをもらいたいこと")

    @field_validator("role", mode="before")
    @classmethod
    def validate_role(cls, v):
        if v is None or not v.strip():
            raise ValueError("役割は必須です")
        return v

    @field_validator("constraints", mode="before")
    @classmethod
    def validate_constraints(cls, v):
        if v is None or not v.strip():
            raise ValueError("制約条件は必須です")
        return v

    @field_validator("adviceInput", mode="before")
    @classmethod
    def validate_adviceInput(cls, v):
        if v is None or not v.strip():
            raise ValueError("アドバイスをもらいたいことは必須です")
        return v
