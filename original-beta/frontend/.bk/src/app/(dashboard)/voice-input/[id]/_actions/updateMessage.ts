'use server';

import 'server-only';
import { Result } from '@/app/_types/result';
import { voiceMessageContainer } from '../../../../../../cosmos';
import { Message } from '../../_utils/schema';

type Response = Result;

export async function updateMessage(requestMessage: Message): Promise<Response> {
  try {
    const { resource: message } = await voiceMessageContainer.items.upsert<Message>({
      id: requestMessage.id,
      threadId: requestMessage.threadId,
      userId: requestMessage.userId,
      content: requestMessage.content,
      role: requestMessage.role,
      chatHistory: requestMessage.chatHistory,
      createdAt: requestMessage.createdAt,
    });

    if (!message) {
      throw new Error('Failed to update message');
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
    };
  }
}
