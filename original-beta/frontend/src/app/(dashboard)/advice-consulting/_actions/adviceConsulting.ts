'use server';

import { adviceConsultingDB } from '@/app/_db/advice-consulting';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { adviceConsultingContainer } from '../../../../../cosmos';

type AdviceConsultingResponse = {
  result: string;
  success: boolean;
  log: LLMserviceBackEndLog<'adviceConsulting'>;
};

type AdviceConsultingErrorResponse = {
  error: string;
};

export async function createAdviceConsulting(
  id: string,
  role: string,
  constraints: string,
  adviceInput: string
): Promise<AdviceConsultingResponse | AdviceConsultingErrorResponse> {
  const user = await getCurrentUser();
  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        role: string;
        constraints: string;
        adviceInput: string;
      },
      AdviceConsultingResponse
    >('advice-consulting', 'POST', {
      role,
      constraints,
      adviceInput,
    });

    // CosmosDBにログを保存
    await adviceConsultingDB(adviceConsultingContainer, {
      id,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      role,
      constraints,
      adviceInput,
      createdAt: new Date(),
      outputForm: response.result,
      log: response.log,
    });

    return response;
  } catch (error) {
    console.error('Error creating advice consulting:', error);
    return {
      error:
        error instanceof Error
          ? error.message
          : getMessage('E_F_00110', 'アドバイス（コンサルティング）'),
    };
  }
}
