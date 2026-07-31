from pydantic import BaseModel, Field, field_validator


class RiskAssessmentPostRequest(BaseModel):
    workerInfo: str = Field(..., title="労働者情報")
    machineInfo: str = Field(..., title="使用する機械")
    workerCountAndPlacement: str = Field(..., title="作業員の人数と配置")
    processDetails: str = Field(..., title="工程の詳細")
    currentMeasures: str = Field(..., title="現状の対策内容")

    @field_validator("workerInfo", mode="before")
    @classmethod
    def validate_workerInfo(cls, v):
        if v is None:
            raise ValueError("workerInfoは必須です")
        return v

    @field_validator("machineInfo", mode="before")
    @classmethod
    def validate_machineInfo(cls, v):
        if v is None:
            raise ValueError("machineInfoは必須です")
        return v

    @field_validator("workerCountAndPlacement", mode="before")
    @classmethod
    def validate_workerCountAndPlacement(cls, v):
        if v is None:
            raise ValueError("workerCountAndPlacementは必須です")
        return v

    @field_validator("processDetails", mode="before")
    @classmethod
    def validate_processDetails(cls, v):
        if v is None:
            raise ValueError("processDetailsは必須です")
        return v

    @field_validator("currentMeasures", mode="before")
    @classmethod
    def validate_currentMeasures(cls, v):
        if v is None:
            raise ValueError("currentMeasuresは必須です")
        return v
