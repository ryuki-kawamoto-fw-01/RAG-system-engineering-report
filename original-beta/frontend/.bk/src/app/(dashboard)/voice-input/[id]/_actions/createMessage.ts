'use server';

import 'server-only';
import { Result } from '@/app/_types/result';
import { voiceMessageContainer } from '../../../../../../cosmos';
import { CreateMessage, Message } from '../../_utils/schema';

type Response = Result & {
  id?: string;
};

export async function createMessage(requestMessage: Message): Promise<Response> {
  try {
    const { resource: message } = await voiceMessageContainer.items.create<CreateMessage>({
      id: requestMessage.id,
      threadId: requestMessage.threadId,
      userId: requestMessage.userId,
      content: requestMessage.content,
      role: requestMessage.role,
      chatHistory: requestMessage.chatHistory,
      createdAt: requestMessage.createdAt ? requestMessage.createdAt : new Date().getTime(),
    });

    if (!message) {
      throw new Error('Failed to create message');
    }

    return {
      success: true,
      id: message.id,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
    };
  }
}
