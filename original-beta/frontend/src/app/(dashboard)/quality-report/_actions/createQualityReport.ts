'use server';

import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { qualityReportContainer } from '../../../../../cosmos';
import { createQualityReportDB } from '../../../_db/quality-report';

type QualityReportRequest = {
  company_name: string;
  manufacturing_type: string;
  current_process_overview: string;
  quality_data_management: string;
  quality_history_data: string;
  quality_issues: string[];
  analysis_period: string;
  improvement_goals: string;
  evaluation_metrics: string[];
  additional_considerations?: string;
  report_detail_level: 'standard' | 'detailed' | 'summary';
};

type QualityReportResponse = {
  report: string;
  company_name: string;
  manufacturing_type: string;
  report_detail_level: 'standard' | 'detailed' | 'summary';
  success: boolean;
  log: LLMserviceBackEndLog<'qualityReport'>;
};

type QualityReportErrorResponse = {
  error: string;
};

type QualityReportReturnResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'qualityReport'>;
};

export async function createQualityReport(
  id: string,
  data: {
    company_name: string;
    manufacturing_type: string;
    current_process_overview: string;
    quality_data_management: string;
    quality_history_data: string;
    quality_issues: string[];
    analysis_period: string;
    improvement_goals: string;
    evaluation_metrics: string[];
    additional_considerations?: string;
    report_detail_level: 'standard' | 'detailed' | 'summary';
  }
): Promise<QualityReportReturnResponse | QualityReportErrorResponse> {
  const user = await getCurrentUser();
  console.log('品質管理レポートAPI呼び出し開始:', { id, data });

  try {
    const requestData = {
      company_name: data.company_name,
      manufacturing_type: data.manufacturing_type,
      current_process_overview: data.current_process_overview,
      quality_data_management: data.quality_data_management,
      quality_history_data: data.quality_history_data,
      quality_issues: data.quality_issues,
      analysis_period: data.analysis_period,
      improvement_goals: data.improvement_goals,
      evaluation_metrics: data.evaluation_metrics,
      additional_considerations: data.additional_considerations,
      report_detail_level: data.report_detail_level,
    };

    console.log('Azure Functions送信データ:', requestData);

    const response = await useCaseAzureFunctions.sendJson<
      QualityReportRequest,
      QualityReportResponse
    >('quality-report', 'POST', requestData);

    console.log('Azure Functionsレスポンス:', response);

    // ログをデータベースに保存
    await createQualityReportDB(qualityReportContainer, {
      id,
      userId: user.id,
      useName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      createdAt: new Date(),
      companyName: data.company_name,
      manufacturingType: data.manufacturing_type,
      currentProcessOverview: data.current_process_overview,
      qualityDataManagement: data.quality_data_management,
      qualityHistoryData: data.quality_history_data,
      qualityIssues: data.quality_issues,
      analysisPeriod: data.analysis_period,
      improvementGoals: data.improvement_goals,
      evaluationMetrics: data.evaluation_metrics,
      additional_considerations: data.additional_considerations,
      report_detail_level: data.report_detail_level,
      outputForm: response.report,
      log: response.log,
    });

    return {
      answer: response.report,
      log: response.log,
    };
  } catch (error) {
    console.error('品質管理レポート作成エラー詳細:', error);
    return {
      error: error instanceof Error ? error.message : getMessage('E_F_00110', '品質管理レポート'),
    };
  }
}
