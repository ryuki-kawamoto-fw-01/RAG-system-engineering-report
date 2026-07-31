'use server';

import 'server-only';
import { getCurrentUser } from '@/app/_utils/auth';
import { ChatThreadModel } from '../../../../../config';
import { deepThreadContainer } from '../../../../../cosmos';

export async function getChatThreads() {
  const user = await getCurrentUser();

  const { resources: threads } = await deepThreadContainer.items
    .query<ChatThreadModel>({
      query:
        'SELECT * FROM c WHERE c.userId = @userId AND NOT IS_DEFINED(c.deletedAt) ORDER BY c.createdAt DESC',
      parameters: [{ name: '@userId', value: user.id }],
    })
    .fetchAll();

  return {
    threads,
  };
}
