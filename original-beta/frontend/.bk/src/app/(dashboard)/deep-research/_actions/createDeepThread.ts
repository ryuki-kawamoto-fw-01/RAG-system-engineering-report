'use server';

import { revalidatePath } from 'next/cache';
import { Result } from '@/app/_types/result';
import { getCurrentUser } from '@/app/_utils/auth';
import { ChatThreadModel } from '../../../../../config';
import { deepThreadContainer } from '../../../../../cosmos';
import { uniqueId } from '../../../_utils/uniqueId';

type Response = Result & {
  id?: string;
};

export async function createDeepThread(): Promise<Response> {
  try {
    const id = uniqueId();
    const user = await getCurrentUser();

    const { resource: thread } = await deepThreadContainer.items.create<ChatThreadModel>({
      id,
      userId: user.id,
    });

    if (!thread) {
      throw new Error('Failed to create thread');
    }

    revalidatePath('/deep-research');

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
