'use server';

import { AzureResponse, ErrorResponse } from '@/app/_actions/types';
import { createTaskBreakdownDB } from '@/app/_db/taskBreakdown';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { taskBreakdownContainer } from '../../../../../cosmos';

export type TaskBreakdownResponse =
  | {
      content: string;
      success: true;
    }
  | ErrorResponse;

export async function taskBreakdown(
  id: string,
  task: string,
  consideration: string
): Promise<TaskBreakdownResponse> {
  const user = await getCurrentUser();

  try {
    const response = await useCaseAzureFunctions.sendJson<
      { task: string; consideration: string },
      AzureResponse & { log: LLMserviceBackEndLog<'taskBreakdown'> }
    >('task-breakdown', 'POST', { task, consideration });

    if (response.success) {
      await createTaskBreakdownDB(taskBreakdownContainer, {
        id,
        userId: user.id,
        useName: user.name,
        userEmail: user.email,
        userDepartmentName: user.departmentName,
        createdAt: new Date(),
        task,
        consideration,
        outputForm: response.answer,
        log: response.log,
      });

      return {
        success: true,
        content: response.answer,
      };
    }
    return {
      message: response.message,
      success: false,
    };
  } catch (error) {
    console.error('Error taskBreakdown:', error);
    return {
      message: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果'),
      success: false,
    };
  }
}
