'use server';

import { AzureResponse, CreateMinutesResponse } from '@/app/_actions/types';
import { updateCreateMinutesDB } from '@/app/_db/create-minutes';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { createMinutesContainer } from '../../../../../cosmos';

export async function fixMinutes(formData: FormData, id: string): Promise<CreateMinutesResponse> {
  const fileList = formData.get('fileList') ? (formData.getAll('fileList') as File[]) : [];

  if (fileList.length === 0) {
    return {
      success: false,
      message: 'ファイルを１つ以上選択してください',
    };
  }

  try {
    const answerResponse = await useCaseAzureFunctions.sendForm<
      AzureResponse & {
        log: LLMserviceBackEndLog<'minutes'>;
      }
    >('fix-minutes', formData);

    // 成功時
    if (answerResponse.success) {
      // log
      await updateCreateMinutesDB(createMinutesContainer, {
        id,
        revisionPrompt: formData.get('revisionPrompt')?.toString() || '',
        outputForm: answerResponse.answer,
        log: answerResponse.log,
      });
      return {
        success: true,
        content: answerResponse.answer,
      };
    }

    // 正規表現を使ってJSON部分を抽出
    const jsonRegex = /\{[\s\S]*\}/; // 波括弧から始まり波括弧で終わる部分を抽出
    const jsonMatch = answerResponse.message.match(jsonRegex);

    if (jsonMatch) {
      const errorObj = JSON.parse(jsonMatch[0]);
      // エラー時
      return {
        success: false,
        message: errorObj.error_message || 'エラーが発生しました。',
      };
    }
    // エラー時
    return {
      success: false,
      message: answerResponse.message || 'エラーが発生しました。',
    };
  } catch (error) {
    console.error('Error creating minutes:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'エラーが発生しました。',
    };
  }
}
