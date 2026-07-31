'use server';

import 'server-only';
import { Result } from '@/app/_types/result';
import { getCurrentUser } from '@/app/_utils/auth';
import { voiceThreadContainer } from '../../../../../cosmos';
import { Thread } from '../_utils/schema';

type Response = Result;

export async function updateChatThread(id: string, title?: string): Promise<Response> {
  try {
    const user = await getCurrentUser();

    const { resource: thread } = await voiceThreadContainer.item(id, user.id).read<Thread>();

    if (!thread) {
      return {
        success: false,
        message: 'このチャットは存在しません',
      };
    }

    await voiceThreadContainer.items.upsert({
      ...thread,
      ...(title && { title }),
      updatedAt: new Date().getTime(),
    });

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
