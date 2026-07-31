'use server';

import { createIdeaDB } from '@/app/_db/idea';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { createIdeaContainer } from '../../../../../cosmos';

type IdeaResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'idea'>;
};

type IdeaErrorResponse = {
  error: string;
};

export async function createIdea(
  id: string,
  ideationSubject: string,
  ideationRole: string,
  ideationCount: number,
  ideationConsideration?: string
): Promise<IdeaResponse | IdeaErrorResponse> {
  const user = await getCurrentUser();
  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        ideationSubject: string;
        ideationRole: string;
        ideationCount: number;
        ideationConsideration?: string;
      },
      IdeaResponse
    >('create-idea', 'POST', {
      ideationSubject,
      ideationRole,
      ideationCount,
      ideationConsideration,
    });

    // log
    await createIdeaDB(createIdeaContainer, {
      id,
      userId: user.id,
      useName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      createdAt: new Date(),
      ideationSubject,
      ideationRole,
      ideationCount,
      ideationConsideration,
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
