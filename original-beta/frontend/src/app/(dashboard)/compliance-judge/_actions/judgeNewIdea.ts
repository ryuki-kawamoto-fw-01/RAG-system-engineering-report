'use server';

import { updateJudgeIdeaDB } from '@/app/_db/judge';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { judgeIdeaContainer } from '../../../../../cosmos';

type NewIdeaResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'judge'>;
};

type NewIdeaErrorResponse = {
  error: string;
};

export async function judgeNewIdea(
  result: string,
  newJudgeRequest: string,
  id: string
): Promise<NewIdeaResponse | NewIdeaErrorResponse> {
  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        result: string;
        newJudgeRequest: string;
      },
      NewIdeaResponse
    >('judge-new-idea', 'POST', {
      result,
      newJudgeRequest,
    });

    // log
    await updateJudgeIdeaDB(judgeIdeaContainer, {
      id,
      createdAt: new Date(),
      newJudgeRequest,
      outputForm: response.answer,
      log: response.log,
    });
    return {
      answer: response.answer,
      log: response.log,
    };
  } catch (error) {
    console.error('Judge new idea error:', error);
    return { error: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果') };
  }
}
