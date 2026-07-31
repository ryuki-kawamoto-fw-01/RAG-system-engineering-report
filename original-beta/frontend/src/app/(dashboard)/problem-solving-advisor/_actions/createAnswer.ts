'use server';

import { ActionResponse } from '@/app/_actions/types';
import { SendChatInput, SendChatInputSchema } from '@/app/_schemas/send-chat';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { ChatResponse, SendChatResponseData } from '../_utils/type';

async function chat(sendChatInput: SendChatInput): Promise<ChatResponse> {
  const lastHumanMessage = sendChatInput.messages.at(-1)?.content;
  // 7件から11件に変更
  const pastMessages = sendChatInput.messages.slice(-11);
  const chatHistory = pastMessages.slice(0, -1).map(({ role, content }) => ({ role, content }));

  const formData = new FormData();
  formData.append('question', lastHumanMessage ?? '');
  formData.append('chatHistory', JSON.stringify(chatHistory));

  const response = await useCaseAzureFunctions.sendForm<{
    success: boolean;
    error?: string;
    data?: ChatResponse;
  }>('problem_solving_advisor', formData);

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Azure Functions経由でのチャット送信に失敗しました。');
  }

  return response.data;
}

export async function createAnswer(
  req: SendChatInput
): Promise<ActionResponse<SendChatResponseData>> {
  const validate = SendChatInputSchema.safeParse(req);
  if (!validate.success) {
    throw new Error('入力値が不正です');
  }
  const body = validate.data;

  try {
    const responseData = await chat(body);

    return {
      data: {
        content: responseData.content ?? '',
        isSummary: responseData.isSummary ?? false,
        // オプショナルチェーンとnullishコアレッシングで安全にアクセス
        logicTree: responseData.logicTree ?? undefined,
        advice: responseData.advice ?? undefined,
        summary: responseData.summary ?? undefined,
        // バックエンドが返さないフィールド
        searchResults: [],
        receivedFileText: undefined,
        refAns: undefined,
        refText: undefined,
      },
      success: true,
    };
  } catch (error) {
    console.error('問題解決アドバイザーエラー:', error);

    // より詳細なエラーメッセージ
    let errorMessage = '不明なエラーが発生しました';
    if (error instanceof Error) {
      errorMessage = `エラー: ${error.message}`;
      // スタックトレースがあれば記録（本番環境では注意）
      if (error.stack && process.env.NODE_ENV !== 'production') {
        console.error('スタックトレース:', error.stack);
      }
    }
    return {
      success: false,
      message: errorMessage,
    };
  }
}
