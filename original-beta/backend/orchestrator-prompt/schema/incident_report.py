from typing import Optional

from pydantic import BaseModel, Field, field_validator


class IncidentReportRequest(BaseModel):
    """インシデントレポート生成のリクエストスキーマ"""
    # 基本情報
    incidentDateTime: str = Field(..., title="発生日時", description="インシデント発生日時")
    incidentLocation: str = Field(..., title="災害発生場所", description="災害が発生した場所")
    reporter: str = Field(..., title="報告者", description="インシデントを報告する人の名前")
    
    # 被災者情報
    yearsOfService: str = Field(..., title="勤続年数", description="被災者の勤続年数")
    workExperience: str = Field(..., title="業務経験", description="被災者の業務経験")
    jobDescription: str = Field(..., title="業務内容", description="被災者が行っていた業務内容")
    
    # 災害情報
    disasterType: str = Field(..., title="災害の種類", description="発生した災害の種類")
    
    # 作業環境評価
    manualAvailability: str = Field(..., title="マニュアルの有無", description="作業マニュアルの有無（あり/なし）")
    complianceStatus: str = Field(..., title="遵守状況", description="マニュアル遵守状況（完全遵守/一部遵守/未遵守）")
    manualLastUpdated: str = Field(..., title="マニュアルの最終更新日", description="マニュアルが最後に更新された日")
    
    # 設備情報
    equipmentName: str = Field(..., title="使用機械/設備名", description="使用していた機械や設備の名前")
    installationYear: str = Field(..., title="導入年", description="機械や設備が導入された年")
    lastInspectionDate: str = Field(..., title="最終点検日", description="最後に点検が行われた日")
    maintenanceHistory: str = Field(..., title="メンテナンス履歴", description="機械や設備のメンテナンス履歴")
    equipmentMalfunctionHistory: str = Field(..., title="機械の不具合歴", description="過去の機械の不具合履歴")

    # 必須フィールドのバリデーション
    @field_validator("incidentDateTime", mode="before")
    @classmethod
    def validate_incident_datetime(cls, v):
        if v is None or v == "":
            raise ValueError("発生日時は必須です")
        return v

    @field_validator("incidentLocation", mode="before")
    @classmethod
    def validate_incident_location(cls, v):
        if v is None or v.strip() == "":
            raise ValueError("災害発生場所は必須です")
        return v.strip()

    @field_validator("reporter", mode="before")
    @classmethod
    def validate_reporter(cls, v):
        if v is None or v.strip() == "":
            raise ValueError("報告者は必須です")
        return v.strip()

    @field_validator("yearsOfService", mode="before")
    @classmethod
    def validate_years_of_service(cls, v):
        if v is None or v.strip() == "":
            raise ValueError("勤続年数は必須です")
        return v.strip()

    @field_validator("jobDescription", mode="before")
    @classmethod
    def validate_job_description(cls, v):
        if v is None or v.strip() == "":
            raise ValueError("業務内容は必須です")
        return v.strip()

    @field_validator("disasterType", mode="before")
    @classmethod
    def validate_disaster_type(cls, v):
        if v is None or v.strip() == "":
            raise ValueError("災害の種類は必須です")
        return v.strip()

    @field_validator("equipmentName", mode="before")
    @classmethod
    def validate_equipment_name(cls, v):
        if v is None or v.strip() == "":
            raise ValueError("使用機械/設備名は必須です")
        return v.strip()

    @field_validator("workExperience", mode="before")
    @classmethod
    def validate_work_experience(cls, v):
        if v is None or v.strip() == "":
            raise ValueError("業務経験は必須です")
        return v.strip()

    @field_validator("installationYear", mode="before")
    @classmethod
    def validate_installation_year(cls, v):
        if v is None or v.strip() == "":
            raise ValueError("導入年は必須です")
        return v.strip()

    @field_validator("lastInspectionDate", mode="before")
    @classmethod
    def validate_last_inspection_date(cls, v):
        if v is None or v.strip() == "":
            raise ValueError("最終点検日は必須です")
        return v.strip()

    @field_validator("maintenanceHistory", mode="before")
    @classmethod
    def validate_maintenance_history(cls, v):
        if v is None or v.strip() == "":
            raise ValueError("メンテナンス履歴は必須です")
        return v.strip()

    @field_validator("equipmentMalfunctionHistory", mode="before")
    @classmethod
    def validate_equipment_malfunction_history(cls, v):
        if v is None or v.strip() == "":
            raise ValueError("機械の不具合歴は必須です")
        return v.strip()

    @field_validator("manualAvailability", mode="before")
    @classmethod
    def validate_manual_availability(cls, v):
        if v is None or v.strip() == "":
            raise ValueError("マニュアルの有無は必須です")
        return v.strip()

    @field_validator("complianceStatus", mode="before")
    @classmethod
    def validate_compliance_status(cls, v):
        if v is None or v.strip() == "":
            raise ValueError("遵守状況は必須です")
        return v.strip()

    @field_validator("manualLastUpdated", mode="before")
    @classmethod
    def validate_manual_last_updated(cls, v):
        if v is None or v.strip() == "":
            raise ValueError("マニュアルの最終更新日は必須です")
        return v.strip()


class IncidentReportResponse(BaseModel):
    """インシデントレポート生成のレスポンススキーマ"""
    content: str = Field(..., title="生成されたインシデントレポート", description="生成された労働災害報告書の内容")
    success: bool = Field(True, title="成功フラグ", description="処理が成功したかどうか")
    message: Optional[str] = Field(None, title="メッセージ", description="処理結果に関するメッセージ")