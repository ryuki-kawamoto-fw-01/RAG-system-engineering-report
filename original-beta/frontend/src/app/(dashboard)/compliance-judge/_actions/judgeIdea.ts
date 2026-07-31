'use server';

import { judgeIdeaDB } from '@/app/_db/judge';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { judgeIdeaContainer } from '../../../../../cosmos';

type IdeaResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'judge'>;
};

type IdeaErrorResponse = {
  error: string;
};

export async function judgeIdea(
  id: string,
  ideationFunction: string,
  ideationUse: string,
  ideationMarket: string,
  ideationCountry: string
): Promise<IdeaResponse | IdeaErrorResponse> {
  const user = await getCurrentUser();
  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        ideationFunction: string;
        ideationUse: string;
        ideationMarket: string;
        ideationCountry: string;
      },
      IdeaResponse
    >('judge-idea', 'POST', {
      ideationFunction,
      ideationUse,
      ideationMarket,
      ideationCountry,
    });

    // log
    await judgeIdeaDB(judgeIdeaContainer, {
      id,
      userId: user.id,
      useName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      createdAt: new Date(),
      ideationFunction,
      ideationUse,
      ideationMarket,
      ideationCountry,
      outputForm: response.answer,
      log: response.log,
    });

    return {
      answer: response.answer,
      log: response.log,
    };
  } catch (error) {
    console.error('Create idea error:', error);
    return { error: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果') };
  }
}
