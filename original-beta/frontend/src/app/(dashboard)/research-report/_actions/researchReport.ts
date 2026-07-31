'use server';

import { researchReportDB } from '@/app/_db/research-report';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { researchReportContainer } from '../../../../../cosmos';

type IdeaResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'idea'>;
};

type IdeaErrorResponse = {
  error: string;
};

export async function researchReport(
  id: string,
  subject: string,
  purpose: string,
  method: string,
  researchresult: string,
  references: string,
  consideration?: string
): Promise<IdeaResponse | IdeaErrorResponse> {
  const user = await getCurrentUser();
  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        subject: string;
        purpose: string;
        method: string;
        researchresult: string;
        references: string;
        consideration?: string;
      },
      IdeaResponse
    >('research-report', 'POST', {
      subject,
      purpose,
      method,
      researchresult,
      references,
      consideration,
    });

    // log
    await researchReportDB(researchReportContainer, {
      id,
      userId: user.id,
      useName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      createdAt: new Date(),
      subject,
      purpose,
      method,
      researchresult,
      references,
      consideration,
      outputForm: response.answer,
      log: response.log,
    });

    return {
      answer: response.answer,
      log: response.log,
    };
  } catch (error) {
    console.error('Research report error:', error);
    return { error: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果') };
  }
}
