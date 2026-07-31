'use server';

import { BulkOperationType, OperationInput } from '@azure/cosmos';
import { revalidatePath } from 'next/cache';
import { Result } from '@/app/_types/result';
import { getCurrentUser } from '@/app/_utils/auth';
import { ChatThreadModel } from '../../../../../../config';
import { agentThreadContainer } from '../../../../../../cosmos';

type Response = Result;
const BATCH_SIZE = 50; // bulk削除のバッチサイズ。bulkでも大きすぎると失敗します。

export async function clearChatThreads(updatePath: string): Promise<Response> {
  try {
    const user = await getCurrentUser();

    const { resources: threads } = await agentThreadContainer.items
      .query<ChatThreadModel>({
        query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC',
        parameters: [{ name: '@userId', value: user.id }],
      })
      .fetchAll();

    const now = new Date().getTime();

    const updatedThreads = threads.map((thread) => ({
      ...thread,
      deletedAt: now,
      createdAt: thread.createdAt?.toString() as string,
      updatedAt: thread.updatedAt?.toString() as string,
    }));

    for (let i = 0; i < updatedThreads.length; i += BATCH_SIZE) {
      const batch = updatedThreads.slice(i, i + BATCH_SIZE);
      const operations: OperationInput[] = batch.map((thread) => ({
        operationType: BulkOperationType.Upsert,
        id: thread.id,
        resourceBody: thread,
      }));

      await agentThreadContainer.items.bulk(operations);
    }
    revalidatePath(updatePath);

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
