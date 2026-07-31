'use server';

import { updateCompanyAnalysisDB } from '@/app/_db/company-analysis';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { companyAnalysisContainer } from '../../../../../cosmos';

type ReanalysisResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'companyAnalysis'>;
};

export type ReanalysisErrorResponse = {
  error: string;
};

type Props = {
  analytical_methods: string[];
  existing_analysis: string;
  reanalysis_request: string;
  id: string;
};

export async function reanalysis(
  props: Props
): Promise<ReanalysisResponse | ReanalysisErrorResponse> {
  try {
    const response = await useCaseAzureFunctions.sendJson<Props, ReanalysisResponse>(
      'company-analysis/reanalysis',
      'POST',
      props
    );

    // log
    await updateCompanyAnalysisDB(companyAnalysisContainer, {
      createdAt: new Date(),
      ...props,
      outputForm: response.answer,
      log: response.log,
    });

    return { answer: response.answer, log: response.log };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error company analysis:', error.message);

      // 正規表現を使ってJSON部分を抽出
      const jsonRegex = /\{[\s\S]*\}/; // 波括弧から始まり波括弧で終わる部分を抽出
      const jsonMatch = error.message.match(jsonRegex);

      if (jsonMatch) {
        const errorObj = JSON.parse(jsonMatch[0]);
        return { error: errorObj.error_message };
      }
    }
    console.error('Error company analysis:', String(error));

    return { error: String(error) };
  }
}
