'use server';

import { textCheckDB } from '@/app/_db/text-check';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { textCheckContainer } from '../../../../../cosmos';

type TextCheckResponse = {
  evaluation: string;
  correctedText: string;
  success: boolean;
  log: LLMserviceBackEndLog<'textCheck'>;
};

type TextCheckErrorResponse = {
  error: string;
};

export async function textCheck(
  id: string,
  formData: FormData,
  selectedTab: string
): Promise<TextCheckResponse | TextCheckErrorResponse> {
  const user = await getCurrentUser();
  try {
    const response = await useCaseAzureFunctions.sendForm<
      TextCheckResponse & { temp_file?: string }
    >('text-check', formData);

    // log
    await textCheckDB(textCheckContainer, {
      id,
      userId: user.id,
      type: selectedTab,
      useName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      createdAt: new Date(),
      textInput: formData.get('textInput') as string,
      checkContent1: formData.get('checkContent1') as string,
      checkContent2: formData.get('checkContent2') as string,
      checkContent3: formData.get('checkContent3') as string,
      outputForm: response.correctedText,
      evaluation: response.evaluation,
      log: response.log,
    });

    return {
      evaluation: response.evaluation,
      correctedText: response.correctedText,
      success: response.success,
      log: response.log,
    };
  } catch (error) {
    console.error('Check text error:', error);
    return { error: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果') };
  }
}
