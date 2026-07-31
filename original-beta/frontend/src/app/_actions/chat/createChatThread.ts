'use server';

import { Container } from '@azure/cosmos';
import { ChatType } from '@/app/_types/chat-type';
import { Result } from '@/app/_types/result';
import { getCurrentUser } from '@/app/_utils/auth';
import { ChatThreadModel } from '../../../../config';
import { agentThreadContainer, ragThreadContainer, threadContainer } from '../../../../cosmos';
import { uniqueId } from '../../_utils/uniqueId';

type Response = Result & {
  id?: string;
};

export async function createChatThread(type: ChatType): Promise<Response> {
  try {
    const id = uniqueId();
    const user = await getCurrentUser();
    let container: Container | null = null;
    if (type === ChatType.Chat) {
      container = threadContainer;
    } else if (type === ChatType.RagChat) {
      container = ragThreadContainer;
    } else if (type === ChatType.Agent) {
      container = agentThreadContainer;
    } else {
      return {
        success: false,
        message: '無効なパラメータです',
      };
    }

    const now = new Date();
    const { resource: thread } = await container.items.create<ChatThreadModel>({
      id,
      userId: user.id,
      createdAt: now,
      updatedAt: now,
    });

    if (!thread) {
      return {
        success: false,
        message: 'このチャットは存在しません',
      };
    }

    return {
      success: true,
      id: thread.id,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
    };
  }
}
