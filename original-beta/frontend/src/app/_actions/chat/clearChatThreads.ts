'use server';

import { BulkOperationType, OperationInput } from '@azure/cosmos';
import { Container } from '@azure/cosmos';
import { ChatType } from '@/app/_types/chat-type';
import { Result } from '@/app/_types/result';
import { getCurrentUser } from '@/app/_utils/auth';
import { ChatThreadModel } from '../../../../config';
import { threadContainer, ragThreadContainer, agentThreadContainer } from '../../../../cosmos';

type Response = Result;
const BATCH_SIZE = 50; // bulk削除のバッチサイズ。bulkでも大きすぎると失敗します。

export async function clearChatThreads(type: ChatType): Promise<Response> {
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

    const { resources: threads } = await container.items
      .query<ChatThreadModel>({
        query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC',
        parameters: [{ name: '@userId', value: user.id }],
      })
      .fetchAll();

    const now = new Date().getTime();

    const updatedThreads = threads.map((thread) => ({
      ...thread,
      deletedAt: now,
    }));

    for (let i = 0; i < updatedThreads.length; i += BATCH_SIZE) {
      const batch = updatedThreads.slice(i, i + BATCH_SIZE);
      const operations: OperationInput[] = batch.map((thread) => ({
        operationType: BulkOperationType.Upsert,
        id: thread.id,
        resourceBody: thread,
      }));

      await container.items.bulk(operations);
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: '予期せぬエラーが発生しました',
    };
  }
}
