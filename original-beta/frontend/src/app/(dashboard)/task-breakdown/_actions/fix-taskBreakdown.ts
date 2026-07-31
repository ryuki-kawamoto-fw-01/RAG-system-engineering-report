'use server';

import { AzureResponse, ErrorResponse } from '@/app/_actions/types';
import { updateTaskBreakdownDB } from '@/app/_db/taskBreakdown';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { taskBreakdownContainer } from '../../../../../cosmos';

export type TaskBreakdownResponse =
  | {
      content: string;
      success: true;
    }
  | ErrorResponse;

export async function fixTaskBreakdown(
  result: string,
  revisionPrompt: string,
  id: string
): Promise<TaskBreakdownResponse> {
  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        result: string;
        revisionPrompt: string;
      },
      AzureResponse & { log: LLMserviceBackEndLog<'taskBreakdown'> }
    >('fix-task-breakdown', 'POST', {
      result,
      revisionPrompt,
    });

    if (response.success) {
      // log
      await updateTaskBreakdownDB(taskBreakdownContainer, {
        id,
        revisionPrompt,
        outputForm: response.answer,
        log: response.log,
      });
      return {
        success: true,
        content: response.answer,
      };
    }
    return {
      success: false,
      message: response.message,
    };
  } catch (error) {
    console.error('Error taskBreakdown:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'エラーが発生しました。',
    };
  }
}
