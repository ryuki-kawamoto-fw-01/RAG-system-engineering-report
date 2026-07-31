'use server';

import { updateDefectAnalysisReportDB } from '@/app/_db/defect-analysis-report';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { defectAnalysisReportContainer } from '../../../../../cosmos';

type ReanalysisResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'defectAnalysisReport'>;
};

type ReanalysisBackendResponse = {
  content: string;
  log: LLMserviceBackEndLog<'defectAnalysisReport'>;
};

export type ReanalysisErrorResponse = {
  error: string;
};

export async function reanalysis(
  id: string,
  formData: FormData
): Promise<ReanalysisResponse | ReanalysisErrorResponse> {
  try {
    const response = await useCaseAzureFunctions.sendForm<ReanalysisBackendResponse>(
      'fix-defect-analysis-report',
      formData
    );

    // log
    try {
      await updateDefectAnalysisReportDB(defectAnalysisReportContainer, {
        id,
        createdAt: new Date(),
        outputForm: response.content,
        log: response.log,
        productName: '',
        defectDescription: '',
        occurenceCondition: '',
        usageEnvironment: '',
        impactScope: '',
        defectData: '',
        consideration: '',
      });
    } catch (dbError) {
      console.error('DB update failed, but continuing with response:', dbError);
    }

    return { answer: response.content, log: response.log };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Defect analysis reanalysis error:', error.message);

      const jsonRegex = /\{[\s\S]*\}/;
      const jsonMatch = error.message.match(jsonRegex);

      if (jsonMatch) {
        const errorObj = JSON.parse(jsonMatch[0]);
        return { error: errorObj.error_message };
      }
    }
    console.error('Defect analysis reanalysis error:', String(error));

    return { error: String(error) };
  }
}
