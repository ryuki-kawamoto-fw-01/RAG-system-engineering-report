'use server';

import { createCompanyAnalysisDB } from '@/app/_db/company-analysis';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { companyAnalysisContainer } from '../../../../../cosmos';

export type CompanyAnalysisResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'companyAnalysis'>;
};

export type CompanyAnalysisErrorResponse = {
  error: string;
};

type Props = {
  id: string;
  company_name: string;
  analytical_methods: string[];
  analysis_purpose?: string;
  business_name?: string;
  analysis_considerations?: string;
};

export async function companyAnalysis(
  props: Props
): Promise<CompanyAnalysisResponse | CompanyAnalysisErrorResponse> {
  const user = await getCurrentUser();

  try {
    const response = await useCaseAzureFunctions.sendJson<Props, CompanyAnalysisResponse>(
      'company-analysis',
      'POST',
      props
    );

    // log
    await createCompanyAnalysisDB(companyAnalysisContainer, {
      userId: user.id,
      useName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
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
