'use server';

import { AzureResponse, TranscriptionHandwrittenResponse } from '@/app/_actions/types';
import { TranscriptionHandwrittenDB } from '@/app/_db/transcription-handwritten';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { transcriptionHandwrittenContainer } from '../../../../../cosmos';

export async function transcriptionHandwritten(
  id: string,
  formData: FormData
): Promise<TranscriptionHandwrittenResponse> {
  const fileList = formData.get('fileList') ? (formData.getAll('fileList') as File[]) : [];
  const user = await getCurrentUser();

  if (fileList.length === 0) {
    throw new Error('ファイルを１つ以上選択してください');
  }

  try {
    const answerResponse = await useCaseAzureFunctions.sendForm<
      AzureResponse & {
        temp_file: string;
        log: LLMserviceBackEndLog<'transcriptionHandwritten'>;
      }
    >('transcription-handwritten', formData);

    // 失敗時
    if (!answerResponse.success) {
      const errorAnswerResponse = answerResponse.message;
      console.error('メッセージの送信が失敗しました。', errorAnswerResponse);
      throw new Error(errorAnswerResponse);
    }
    // log
    await TranscriptionHandwrittenDB(transcriptionHandwrittenContainer, {
      id,
      userId: user.id,
      useName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      createdAt: new Date(),
      outputForm: answerResponse.answer,
      inputForm: answerResponse.temp_file,
      log: answerResponse.log,
    });

    return {
      success: true,
      content: answerResponse.answer,
    };
  } catch (error) {
    console.error('Error creating transcription handwritten:', error);
    return {
      message: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果'),
      success: false,
    };
  }
}
