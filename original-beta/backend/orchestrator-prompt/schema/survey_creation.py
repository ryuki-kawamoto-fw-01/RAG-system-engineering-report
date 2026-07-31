from pydantic import BaseModel, Field, field_validator


class SurveyCreationPostRequest(BaseModel):
    surveyPurpose: str = Field(..., title="アンケートの目的")
    targetAudience: str = Field(..., title="アンケート対象者")
    questionCount: str = Field(..., title="質問項目数")
    responseMethod: str = Field(..., title="回答方式")

    @field_validator("surveyPurpose", mode="before")
    @classmethod
    def validate_survey_purpose(cls, v):
        if v is None or not v.strip():
            raise ValueError("アンケートの目的は必須です")
        return v

    @field_validator("targetAudience", mode="before")
    @classmethod
    def validate_target_audience(cls, v):
        if v is None or not v.strip():
            raise ValueError("アンケート対象者は必須です")
        return v

    @field_validator("questionCount", mode="before")
    @classmethod
    def validate_question_count(cls, v):
        if v is None or not v.strip():
            raise ValueError("質問項目数は必須です")
        return v

    @field_validator("responseMethod", mode="before")
    @classmethod
    def validate_response_method(cls, v):
        if v is None or not v.strip():
            raise ValueError("回答方式は必須です")
        return v
