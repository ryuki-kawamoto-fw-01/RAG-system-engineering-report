'use server';

import { getCurrentUser } from '@/app/_utils/auth';
import 'server-only';
import { voiceMessageContainer, voiceThreadContainer } from '../../../../../../cosmos';
import { Thread } from '../../_utils/schema';

export async function getChatThreadForFeedback(id: string) {
  const user = await getCurrentUser();

  const { resource: thread } = await voiceThreadContainer.item(id, user.id).read<Thread>();

  if (!thread || thread.deletedAt !== undefined) {
    return {
      id: null,
      messages: [],
    };
  }

  const { resources: messages } = await voiceMessageContainer.items
    .query({
      query: 'SELECT * FROM c WHERE c.threadId = @threadId AND c.userId = @userId',
      parameters: [
        { name: '@threadId', value: id },
        { name: '@userId', value: user.id },
      ],
    })
    .fetchAll();

  return {
    id: thread.id,
    messages,
  };
}
