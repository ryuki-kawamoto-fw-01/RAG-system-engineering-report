'use server';

import { createDefectAnalysisReportDB } from '@/app/_db/defect-analysis-report';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { defectAnalysisReportContainer } from '../../../../../cosmos';

export type DefectAnalysisReportResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'defectAnalysisReport'>;
};

type DefectAnalysisReportBackendResponse = {
  content: string;
  log: LLMserviceBackEndLog<'defectAnalysisReport'>;
};

export type DefectAnalysisReportErrorResponse = {
  error: string;
};

export async function defectAnalysisReport(
  id: string,
  formData: FormData
): Promise<DefectAnalysisReportResponse | DefectAnalysisReportErrorResponse> {
  const user = await getCurrentUser();

  try {
    const response = await useCaseAzureFunctions.sendForm<DefectAnalysisReportBackendResponse>(
      'defect-analysis-report',
      formData
    );

    // log
    await createDefectAnalysisReportDB(defectAnalysisReportContainer, {
      userId: user.id,
      useName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      createdAt: new Date(),
      productName: formData.get('productName') as string,
      defectDescription: formData.get('defectDescription') as string,
      occurenceCondition: formData.get('occurenceCondition') as string,
      usageEnvironment: formData.get('usageEnvironment') as string,
      impactScope: formData.get('impactScope') as string,
      defectData: formData.get('defectData') as string,
      consideration: (formData.get('consideration') as string) || '',
      outputForm: response.content,
      log: response.log,
    });

    return { answer: response.content, log: response.log };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Defect analysis report error:', error.message);

      const jsonRegex = /\{[\s\S]*\}/;
      const jsonMatch = error.message.match(jsonRegex);

      if (jsonMatch) {
        const errorObj = JSON.parse(jsonMatch[0]);
        return { error: errorObj.error_message };
      }
    }
    console.error('Defect analysis report error:', String(error));

    return { error: String(error) };
  }
}

export default defectAnalysisReport;
