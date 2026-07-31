'use server';

import { revalidatePath } from 'next/cache';
import { Result } from '@/app/_types/result';
import { getCurrentUser } from '@/app/_utils/auth';
import { voiceThreadContainer } from '../../../../../cosmos';
import { Thread } from '../_utils/schema';

type Response = Result;

export async function clearChatThreads(): Promise<Response> {
  try {
    const user = await getCurrentUser();

    const { resources: threads } = await voiceThreadContainer.items
      .query<Thread>({
        query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC',
        parameters: [{ name: '@userId', value: user.id }],
      })
      .fetchAll();

    const now = new Date().getTime();

    const updatedThreads = threads.map((thread) => ({
      ...thread,
      deletedAt: now,
    }));

    await Promise.all(updatedThreads.map((thread) => voiceThreadContainer.items.upsert(thread)));

    // ページのリロードを行う
    revalidatePath('/voice-input');

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
