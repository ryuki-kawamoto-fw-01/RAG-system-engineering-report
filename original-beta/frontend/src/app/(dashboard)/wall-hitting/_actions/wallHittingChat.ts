'use server';

import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { WallHittingMessage } from '../_utils/type';

type WallHittingChatResponse = {
  content: string;
};

export async function wallHittingChat(messages: WallHittingMessage[]): Promise<WallHittingMessage> {
  // 最新のユーザーメッセージ
  const lastUserMessage = messages.at(-1)?.content ?? '';
  // 過去の履歴（AI側の仕様に合わせて整形）
  const chatHistory = messages.slice(0, -1).map(({ role, content }) => ({ role, content }));

  const formData = new FormData();
  formData.append('question', lastUserMessage);
  formData.append('chatHistory', JSON.stringify(chatHistory));

  const response = await useCaseAzureFunctions.sendForm<{
    success: boolean;
    error?: string;
    data?: WallHittingChatResponse;
  }>('wall-hitting-chat', formData);

  if (!response.success || !response.data) {
    throw new Error(response.error || 'チャット送信に失敗しました。');
  }

  return {
    id: Date.now().toString(),
    role: 'assistant',
    content: response.data.content,
  };
}
