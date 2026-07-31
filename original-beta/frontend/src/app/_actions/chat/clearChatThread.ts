'use server';

import { Container } from '@azure/cosmos';
import { revalidatePath } from 'next/cache';
import { ChatType } from '@/app/_types/chat-type';
import { Result } from '@/app/_types/result';
import { getCurrentUser } from '@/app/_utils/auth';
import { ChatThreadModel } from '../../../../config';
import { agentThreadContainer, ragThreadContainer, threadContainer } from '../../../../cosmos';

type Response = Result;

function getTypeName(type: ChatType): string {
  const typeNames = {
    [ChatType.Chat]: 'チャット',
    [ChatType.RagChat]: 'RAGチャット',
    [ChatType.Agent]: 'タスク',
    default: 'チャット',
  };
  return typeNames[type] || typeNames.default;
}

export default async function clearChatThread(
  id: string,
  type: ChatType,
  reloadPath: string
): Promise<Response> {
  try {
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
    const { resource: thread } = await container.item(id, user.id).read<ChatThreadModel>();

    if (!thread) {
      return {
        success: false,
        message: `この${getTypeName(type)}は存在しません`,
      };
    }

    if (thread.deletedAt !== undefined) {
      return {
        success: false,
        message: `この${getTypeName(type)}は既に削除済みです`,
      };
    }

    const now = new Date().getTime();

    await container.items.upsert({
      ...thread,
      deletedAt: now,
    });

    revalidatePath(reloadPath);
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
