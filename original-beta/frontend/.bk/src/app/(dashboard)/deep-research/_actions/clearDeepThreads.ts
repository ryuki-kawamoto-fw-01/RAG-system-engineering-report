'use server';

import { revalidatePath } from 'next/cache';
import { Result } from '@/app/_types/result';
import { getCurrentUser } from '@/app/_utils/auth';
import { ChatThreadModel } from '../../../../../config';
import { deepThreadContainer } from '../../../../../cosmos';

type Response = Result;

export async function clearDeepThreads(): Promise<Response> {
  try {
    const user = await getCurrentUser();

    const { resources: threads } = await deepThreadContainer.items
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

    await Promise.all(updatedThreads.map((thread) => deepThreadContainer.items.upsert(thread)));

    // ページのリロードを行う
    revalidatePath('/deep-research');

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
