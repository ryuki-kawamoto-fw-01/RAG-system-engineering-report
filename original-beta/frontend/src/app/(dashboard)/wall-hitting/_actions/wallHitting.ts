'use server';

import { wallHittingDB } from '@/app/_db/wall-hitting';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { wallHittingContainer } from '../../../../../cosmos';

type HittingResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'hitting'>;
};

type HittingErrorResponse = {
  error: string;
};

export async function wallHitting(
  id: string,
  theme: string,
  idea: string
): Promise<HittingResponse | HittingErrorResponse> {
  const user = await getCurrentUser();
  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        theme: string;
        idea: string;
      },
      HittingResponse
    >('wall-hitting', 'POST', {
      theme,
      idea,
    });

    // log
    await wallHittingDB(wallHittingContainer, {
      id,
      userId: user.id,
      useName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      createdAt: new Date(),
      theme,
      idea,
      outputForm: response.answer,
      log: response.log,
    });

    return {
      answer: response.answer,
      log: response.log,
    };
  } catch (error) {
    console.error('Create wall hitting  error:', error);
    return { error: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果') };
  }
}
