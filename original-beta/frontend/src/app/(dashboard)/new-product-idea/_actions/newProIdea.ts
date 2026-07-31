'use server';

import { NewProductIdeaResponse } from '@/app/_actions/types';
import { useCaseAzureFunctions } from '../../../../../azure-functions';

export async function newProIdea(formData: FormData): Promise<NewProductIdeaResponse> {
  try {
    const answerResponse = await useCaseAzureFunctions.sendForm<NewProductIdeaResponse>(
      'create-product-idea',
      formData
    );
    // 成功時の処理
    if (answerResponse.success) {
      return {
        content: answerResponse.content,
        chat: answerResponse.chat,
        success: true,
      };
    }

    // エラー時の処理
    return {
      message: answerResponse.message || 'エラーが発生しました。',
      success: false,
    };
  } catch (error) {
    // キャッチされたエラーを処理
    console.error('Error creating new product idea', error);

    return {
      message: error instanceof Error ? error.message : 'エラーが発生しました。',
      success: false,
    };
  }
}
