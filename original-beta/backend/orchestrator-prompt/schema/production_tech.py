from pydantic import BaseModel, Field, field_validator


class ProductionTechPostRequest(BaseModel):
    category: str = Field(..., title="新製品が属する分野")
    focus: str = Field(..., title="生産技術に関して重視したい点")
    issues: str = Field(..., title="既存の生産技術に対して抱えている課題や問題点")

    @field_validator("category", mode="before")
    @classmethod
    def validate_category(cls, v):
        if not v:
            raise ValueError("新製品が属する分野は必須です")
        return v

    @field_validator("focus", mode="before")
    @classmethod
    def validate_focus(cls, v):
        if not v:
            raise ValueError("生産技術に関して重視したい点は必須です")
        return v

    @field_validator("issues", mode="before")
    @classmethod
    def validate_issues(cls, v):
        return v


class ProductionTechNewPostRequest(BaseModel):
    result: str = Field(..., title="既存の出力")
    newProductionTechRequest: str = Field(..., title="追加の要件")

    @field_validator("result", mode="before")
    @classmethod
    def validate_result(cls, v):
        if v is None:
            raise ValueError("resultは必須です")
        return v

    @field_validator("newProductionTechRequest", mode="before")
    @classmethod
    def validate_newProductionTechRequest(cls, v):
        if v is None:
            raise ValueError("new_production_tech_requestは必須です")
        return v
