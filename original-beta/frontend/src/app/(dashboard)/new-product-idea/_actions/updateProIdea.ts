'use server';

import { NewProductIdeaResponse } from '@/app/_actions/types';
import { useCaseAzureFunctions } from '../../../../../azure-functions';

export async function updateProIdea(
  chat: string,
  chatHistory: { role: string; chat: string }[],
  productIdea: string
): Promise<NewProductIdeaResponse> {
  try {
    const answerResponse = await useCaseAzureFunctions.sendJson<
      {
        chat: string;
        chatHistory: { role: string; chat: string }[];
        productIdea: string;
      },
      NewProductIdeaResponse
    >('update-product-idea', 'POST', {
      chat,
      chatHistory,
      productIdea,
    });
    //成功時の処理
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
    console.error('Error creating new product idea', error);
    return {
      message: error instanceof Error ? error.message : 'エラーが発生しました。',
      success: false,
    };
  }
}
