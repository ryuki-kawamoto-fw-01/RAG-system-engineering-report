'use server';

import { BulkOperationType, OperationInput } from '@azure/cosmos';
import { revalidatePath } from 'next/cache';
import { Result } from '@/app/_types/result';
import { getCurrentUser } from '@/app/_utils/auth';
import { ChatThreadModel, ChatMessageModel } from '../../../../../config';
import { threadContainer, messageContainer } from '../../../../../cosmos';

type Response = Result;
const BATCH_SIZE = 50;

export async function clearChatThreads(): Promise<Response> {
  try {
    const user = await getCurrentUser();

    const { resources: threads } = await threadContainer.items
      .query<ChatThreadModel>({
        query:
          'SELECT * FROM c WHERE c.userId = @userId AND NOT IS_DEFINED(c.deletedAt) ORDER BY c.createdAt DESC',
        parameters: [{ name: '@userId', value: user.id }],
      })
      .fetchAll();

    const deletedAt = new Date();

    // スレッドの論理削除
    const updatedThreads = threads.map((thread) => ({
      ...thread,
      deletedAt: deletedAt.toString() as string,
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

      await threadContainer.items.bulk(operations);
    }

    // 各スレッドのメッセージも論理削除
    for (const thread of threads) {
      const query = {
        query: 'SELECT * FROM c WHERE c.threadId = @threadId',
        parameters: [{ name: '@threadId', value: thread.id }],
      };
      const { resources: messages } = await messageContainer.items
        .query<ChatMessageModel>(query)
        .fetchAll();

      for (const message of messages) {
        await messageContainer.items.upsert({
          ...message,
          deletedAt,
        });
      }
    }

    // ページのリロードを行う
    revalidatePath('/chat');

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
