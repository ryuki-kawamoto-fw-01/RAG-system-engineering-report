'use server';

import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';

type NewIdeaResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'idea'>;
};

type NewIdeaErrorResponse = {
  error: string;
};

export async function NewNeedsSurvey(
  result: string,
  newIdeaRequest: string
): Promise<NewIdeaResponse | NewIdeaErrorResponse> {
  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        result: string;
        newIdeaRequest: string;
      },
      NewIdeaResponse
    >('new-needs-survey', 'POST', {
      result,
      newIdeaRequest,
    });

    return {
      answer: response.answer,
      log: response.log,
    };
  } catch (error) {
    console.error('new-needs-survey error:', error);
    return { error: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果') };
  }
}
