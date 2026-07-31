'use server';

import { revalidatePath } from 'next/cache';
import { Result } from '@/app/_types/result';
import { getCurrentUser } from '@/app/_utils/auth';
import { ChatThreadModel } from '../../../../../config';
import { deepThreadContainer } from '../../../../../cosmos';

type Response = Result;

export default async function clearDeepThread(id: string): Promise<Response> {
  try {
    const user = await getCurrentUser();

    const { resource: thread } = await deepThreadContainer
      .item(id, user.id)
      .read<ChatThreadModel>();

    if (!thread) {
      return {
        success: false,
        message: 'このリサーチは存在しません',
      };
    }

    if (thread.deletedAt !== undefined) {
      return {
        success: false,
        message: 'このリサーチは既に削除済みです',
      };
    }

    const now = new Date().getTime();

    await deepThreadContainer.items.upsert({
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
    revalidatePath('/deep-research');
  }
}
