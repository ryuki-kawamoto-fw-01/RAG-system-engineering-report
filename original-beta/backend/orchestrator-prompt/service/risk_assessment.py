import logging

import azure.functions as func

from repository.aoai import AoaiRepository
from schema.risk_assessment import RiskAssessmentPostRequest
from system.risk_assessment import get_risk_assessment_message


class RiskAssessmentService:
    def __init__(self, repository: AoaiRepository, request: func.HttpRequest):
        self.repository = repository
        self.request = request

    def body_parser(self) -> RiskAssessmentPostRequest:
        req_body = self.request.get_json()
        workerInfo = req_body.get("workerInfo")
        machineInfo = req_body.get("machineInfo")
        workerCountAndPlacement = req_body.get("workerCountAndPlacement")
        processDetails = req_body.get("processDetails")
        currentMeasures = req_body.get("currentMeasures")

        params = RiskAssessmentPostRequest(
            workerInfo=workerInfo,
            machineInfo=machineInfo,
            workerCountAndPlacement=workerCountAndPlacement,
            processDetails=processDetails,
            currentMeasures=currentMeasures,
        )
        logging.info(f"Request body: {params}")
        return params

    def post_risk_assessment(self):
        workerInfo = self.body_parser().workerInfo
        machineInfo = self.body_parser().machineInfo
        workerCountAndPlacement = self.body_parser().workerCountAndPlacement
        processDetails = self.body_parser().processDetails
        currentMeasures = self.body_parser().currentMeasures

        result = self.repository.create_aoai_answer(
            get_risk_assessment_message(
                workerInfo,
                machineInfo,
                workerCountAndPlacement,
                processDetails,
                currentMeasures,
            )
        )

        response_data = {"result": result, "success": True}

        return response_data


def parse_markdown_table(md_table: str):
    # 行ごとに分割し、空行を除去
    lines = [line.strip() for line in md_table.splitlines() if line.strip()]
    if len(lines) < 2:
        raise ValueError("表として解釈できる行数が不足しています。")

    # ヘッダー行（先頭行）
    headers_line = lines[0]
    # 区切り線（2行目）はスキップ
    data_lines = lines[2:] if len(lines) > 1 else []

    def split_row(row: str):
        # 先頭・末尾のパイプを除去し、セルを分割
        if row.startswith("|"):
            row = row[1:]
        if row.endswith("|"):
            row = row[:-1]
        cells = [c.strip() for c in row.split("|")]
        return cells

    headers = split_row(headers_line)
    rows = [split_row(dl) for dl in data_lines]

    # ヘッダーと列数が一致しない行があれば調整（不足は空文字、超過は切り捨て）
    normalized_rows = []
    col_count = len(headers)
    for r in rows:
        if len(r) < col_count:
            r = r + [""] * (col_count - len(r))
        elif len(r) > col_count:
            r = r[:col_count]
        normalized_rows.append(r)

    return {"table": {"headers": headers, "rows": normalized_rows}}
