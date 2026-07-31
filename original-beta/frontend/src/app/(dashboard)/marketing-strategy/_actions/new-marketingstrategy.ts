'use server';

// import { updateBrainstormingDB } from '@/app/_db/brainstorming';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
// import { brainstormingContainer } from '../../../../../cosmos';

type NewIdeaResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'idea'>;
};

type NewIdeaErrorResponse = {
  error: string;
};

export async function NewMarketingStrategy(
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
    >('new-marketing-strategy', 'POST', {
      result,
      newIdeaRequest,
    });

    return {
      answer: response.answer,
      log: response.log,
    };
  } catch (error) {
    console.error('new-marketing-strategy error:', error);
    return { error: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果') };
  }
}
