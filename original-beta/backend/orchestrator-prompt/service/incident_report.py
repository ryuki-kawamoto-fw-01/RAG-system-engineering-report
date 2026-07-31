import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.incident_report import IncidentReportRequest
from system.incident_report import get_incident_report_message


class IncidentReportService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request
    
    def form_parser(self) -> IncidentReportRequest:
        # JSON形式・form形式どちらにも対応
        try:
            data = self.request.get_json()
            logging.info("Request received as JSON.")
        except Exception:
            data = self.request.form
            logging.info("Request received as form.")

        incident_datetime = data.get("incidentDateTime")
        incident_location = data.get("incidentLocation")
        reporter = data.get("reporter")
        years_of_service = data.get("yearsOfService")
        work_experience = data.get("workExperience")
        job_description = data.get("jobDescription")
        disaster_type = data.get("disasterType")
        manual_availability = data.get("manualAvailability")
        compliance_status = data.get("complianceStatus")
        manual_last_updated = data.get("manualLastUpdated")
        equipment_name = data.get("equipmentName")
        installation_year = data.get("installationYear")
        last_inspection_date = data.get("lastInspectionDate")
        maintenance_history = data.get("maintenanceHistory")
        equipment_malfunction_history = data.get("equipmentMalfunctionHistory")

        params = IncidentReportRequest(
            incidentDateTime=incident_datetime,
            incidentLocation=incident_location,
            reporter=reporter,
            yearsOfService=years_of_service,
            workExperience=work_experience,
            jobDescription=job_description,
            disasterType=disaster_type,
            manualAvailability=manual_availability,
            complianceStatus=compliance_status,
            manualLastUpdated=manual_last_updated,
            equipmentName=equipment_name,
            installationYear=installation_year,
            lastInspectionDate=last_inspection_date,
            maintenanceHistory=maintenance_history,
            equipmentMalfunctionHistory=equipment_malfunction_history,
        )
        logging.info(f"Request params: {params}")
        return params
    
    def post_incident_report(self):
        """インシデントレポートを生成する"""
        parsed_data = self.form_parser()
        
        # システムプロンプトを取得
        prompt_messages = get_incident_report_message(
            parsed_data.incidentDateTime,
            parsed_data.incidentLocation,
            parsed_data.reporter,
            parsed_data.yearsOfService,
            parsed_data.workExperience,
            parsed_data.jobDescription,
            parsed_data.disasterType,
            parsed_data.manualAvailability,
            parsed_data.complianceStatus,
            parsed_data.manualLastUpdated,
            parsed_data.equipmentName,
            parsed_data.installationYear,
            parsed_data.lastInspectionDate,
            parsed_data.maintenanceHistory,
            parsed_data.equipmentMalfunctionHistory,
        )

        # Azure OpenAIで生成
        answer = self.repository.create_aoai_answer_reasoning(prompt_messages)

        # レスポンスデータの作成
        response_data = {"content": answer, "success": True}

        return response_data
