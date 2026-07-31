'use server';

import { getCurrentUser } from '@/app/_utils/auth';
import { ChatMessageModel } from '../../../../../../config';
import { ragMessageContainer } from '../../../../../../cosmos';

export async function getMessage(id: string) {
  const user = await getCurrentUser();

  if (!user.id) {
    throw new Error('Unauthorized: User ID not found');
  }

  try {
    const { resource: message } = await ragMessageContainer
      .item(id, user.id)
      .read<ChatMessageModel>();

    if (!message) {
      return null;
    }

    return {
      feedbackAt: message.feedbackAt,
    };
  } catch (error) {
    console.error('Error fetching message:', error);
    throw new Error('Failed to fetch message');
  }
}
