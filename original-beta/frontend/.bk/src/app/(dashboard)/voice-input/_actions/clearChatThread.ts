'use server';

import { revalidatePath } from 'next/cache';
import { Result } from '@/app/_types/result';
import { getCurrentUser } from '@/app/_utils/auth';
import { voiceThreadContainer } from '../../../../../cosmos';
import { Thread } from '../_utils/schema';

type Response = Result;

export default async function clearChatThread(id: string): Promise<Response> {
  try {
    const user = await getCurrentUser();

    const { resource: thread } = await voiceThreadContainer.item(id, user.id).read<Thread>();

    if (!thread) {
      return {
        success: false,
        message: 'このチャットは存在しません',
      };
    }

    if (thread.deletedAt !== undefined) {
      return {
        success: false,
        message: 'このチャットは既に削除済みです',
      };
    }

    const now = new Date().getTime();

    await voiceThreadContainer.items.upsert({
      ...thread,
      deletedAt: now,
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
    };
  } finally {
    // ページのリロードを行う
    revalidatePath('/voice-input');
  }
}
