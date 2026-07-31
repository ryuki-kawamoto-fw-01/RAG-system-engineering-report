'use server';

import { AzureResponse, CreateMinutesResponse } from '@/app/_actions/types';
import { createCreateMinutesDB } from '@/app/_db/create-minutes';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { createMinutesContainer } from '../../../../../cosmos';

export async function createMinutes(
  id: string,
  formData: FormData
): Promise<CreateMinutesResponse> {
  const fileListJson = formData.get('fileList') as string;
  const user = await getCurrentUser();

  // fileListはJSON文字列なのでパース
  let fileList = [];
  try {
    fileList = JSON.parse(fileListJson || '[]');
  } catch (error) {
    console.error('Failed to parse fileList:', error);
  }

  if (fileList.length === 0) {
    throw new Error('ファイルを１つ以上選択してください');
  }

  try {
    const answerResponse = await useCaseAzureFunctions.sendForm<
      AzureResponse & {
        temp_file: string;
        log: LLMserviceBackEndLog<'minutes'>;
      }
    >('create-minutes', formData);

    // 失敗時
    if (!answerResponse.success) {
      const errorAnswerResponse = answerResponse.message;
      console.error('メッセージの送信が失敗しました。', errorAnswerResponse);
      throw new Error(errorAnswerResponse);
    }
    // log
    await createCreateMinutesDB(createMinutesContainer, {
      id,
      userId: user.id,
      useName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      createdAt: new Date(),
      meetingPurpose: formData.get('meetingPurpose')?.toString() || '',
      outputForm: answerResponse.answer,
      inputForm: answerResponse.temp_file,
      log: answerResponse.log,
    });

    return {
      success: true,
      content: answerResponse.answer,
    };
  } catch (error) {
    console.error('Error creating minutes:', error);
    return {
      message: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果'),
      success: false,
    };
  }
}
