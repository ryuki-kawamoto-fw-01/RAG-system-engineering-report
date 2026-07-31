'use server';

import { adviceReactDB } from '@/app/_db/advice-react';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { adviceReactContainer } from '../../../../../cosmos';

type AdviceReactResponse = {
  result: string;
  log: LLMserviceBackEndLog<'adviceReact'>;
};

type AdviceReactErrorResponse = {
  error: string;
};

export async function createAdviceReact(
  id: string,
  adviceInput: string
): Promise<AdviceReactResponse | AdviceReactErrorResponse> {
  const user = await getCurrentUser();
  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        adviceInput: string;
      },
      AdviceReactResponse
    >('advice-react', 'POST', {
      adviceInput,
    });

    // log
    await adviceReactDB(adviceReactContainer, {
      id,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      adviceInput,
      createdAt: new Date(),
      outputForm: response.result,
      log: response.log,
    });

    return {
      result: response.result,
      log: response.log,
    };
  } catch (error) {
    console.error('Create advice react error:', error);
    return { error: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果') };
  }
}
