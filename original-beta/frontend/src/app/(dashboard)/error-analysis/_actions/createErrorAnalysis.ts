'use server';

import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { errorAnalysisContainer } from '../../../../../cosmos';
import { createErrorAnalysisDB } from '../../../_db/error-analysis';

type ErrorAnalysisResponse = {
  explanation: string;
  solutionAndExample: string;
  success: boolean;
  log: LLMserviceBackEndLog<'error-analysis'>;
};

type ErrorAnalysisErrorResponse = {
  error: string;
};

export async function createErrorAnalysis(
  id: string,
  programmingLanguage: string,
  errorMessage: string,
  considerations: string
): Promise<ErrorAnalysisResponse | ErrorAnalysisErrorResponse> {
  const user = await getCurrentUser();
  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        programmingLanguage: string;
        errorMessage: string;
        considerations: string;
      },
      ErrorAnalysisResponse
    >('error-analysis', 'POST', {
      programmingLanguage,
      errorMessage,
      considerations,
    });

    // log
    await createErrorAnalysisDB(errorAnalysisContainer, {
      id,
      userId: user.id,
      useName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      createdAt: new Date(),
      programmingLanguage,
      errorMessage,
      considerations,
      explanation: response.explanation,
      solutionAndExample: response.solutionAndExample,
      log: response.log,
    });

    return {
      explanation: response.explanation,
      solutionAndExample: response.solutionAndExample,
      success: response.success,
      log: response.log,
    };
  } catch (error) {
    console.error('Create error analysis error:', error);
    return { error: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果') };
  }
}
