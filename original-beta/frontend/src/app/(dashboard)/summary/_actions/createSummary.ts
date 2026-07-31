'use server';

import { createSummaryDB } from '@/app/_db/summary';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { Result } from '@/app/_types/result';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { summaryContainer } from '../../../../../cosmos';
import { SummaryErrors } from '../_type';

type Response = Result<SummaryErrors> & {
  content?: string;
  log?: LLMserviceBackEndLog<'summary'>;
};

export async function createSummary(id: string, formData: FormData): Promise<Response> {
  const user = await getCurrentUser();
  try {
    const answerResponse = await useCaseAzureFunctions.sendForm<Response>('summary', formData);
    if (!answerResponse.success) {
      return {
        message: answerResponse.message || getMessage('E_F_00110', '要約結果'),
        success: false,
      };
    }
    // log
    await createSummaryDB(summaryContainer, {
      id,
      userId: user.id,
      useName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      createdAt: new Date(),
      type: formData.get('activeTab') as 'short' | 'long' | 'custom',
      summaryLength: formData.get('summaryLength') as string,
      content: formData.get('content') as string,
      consideration: formData.get('consideration') as string,
      outputForm: answerResponse.content ?? '',
      log: answerResponse.log,
    });
    return {
      content: answerResponse.content,
      success: true,
      log: answerResponse.log,
    };
  } catch (error) {
    console.error('Create summary error:', error);
    return {
      message: error instanceof Error ? error.message : getMessage('E_F_00110', '要約結果'),
      success: false,
    };
  }
}
