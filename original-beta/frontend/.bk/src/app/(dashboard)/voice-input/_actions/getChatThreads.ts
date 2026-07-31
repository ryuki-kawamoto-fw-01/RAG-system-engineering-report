'use server';

import 'server-only';
import { getCurrentUser } from '@/app/_utils/auth';
import { voiceThreadContainer } from '../../../../../cosmos';
import { Thread } from '../_utils/schema';

export async function getChatThreads() {
  const user = await getCurrentUser();

  const { resources: threads } = await voiceThreadContainer.items
    .query<Thread>({
      query:
        'SELECT * FROM c WHERE c.userId = @userId AND NOT IS_DEFINED(c.deletedAt) ORDER BY c.createdAt DESC',
      parameters: [{ name: '@userId', value: user.id }],
    })
    .fetchAll();

  return {
    threads,
  };
}
