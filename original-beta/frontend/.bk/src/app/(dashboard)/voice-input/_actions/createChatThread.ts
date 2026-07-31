'use server';

import { revalidatePath } from 'next/cache';
import { Result } from '@/app/_types/result';
import { getCurrentUser } from '@/app/_utils/auth';
import { voiceThreadContainer } from '../../../../../cosmos';
import { uniqueId } from '../../../_utils/uniqueId';
import { CreateChatThread } from '../_utils/schema';

type Response = Result & {
  id?: string;
};

export async function createChatThread(): Promise<Response> {
  try {
    const id = uniqueId();
    const user = await getCurrentUser();

    const { resource: thread } = await voiceThreadContainer.items.create<CreateChatThread>({
      id,
      userId: user.id,
      title: '',
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
    });

    if (!thread) {
      throw new Error('Failed to create thread');
    }

    revalidatePath('/voice-input');

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
