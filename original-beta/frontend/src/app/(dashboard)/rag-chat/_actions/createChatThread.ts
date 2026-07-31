'use server';

import { revalidatePath } from 'next/cache';
import { Result } from '@/app/_types/result';
import { getCurrentUser } from '@/app/_utils/auth';
import { ChatThreadModel } from '../../../../../config';
import { ragThreadContainer } from '../../../../../cosmos';
import { uniqueId } from '../../../_utils/uniqueId';

type Response = Result & {
  id?: string;
};

export async function createChatThread(): Promise<Response> {
  try {
    const id = uniqueId();
    const user = await getCurrentUser();

    const now = new Date();
    const { resource: thread } = await ragThreadContainer.items.create<ChatThreadModel>({
      id,
      userId: user.id,
      createdAt: now,
      updatedAt: now,
    });

    if (!thread) {
      throw new Error('Failed to create thread');
    }

    revalidatePath('/rag-chat');

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
