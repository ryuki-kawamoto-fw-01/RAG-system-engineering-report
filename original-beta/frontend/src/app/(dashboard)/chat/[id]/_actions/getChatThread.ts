'use server';

import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/app/_utils/auth';
import 'server-only';
import { ChatThreadModel } from '../../../../../../config';
import { messageContainer, threadContainer } from '../../../../../../cosmos';

export async function getChatThread(id: string) {
  const user = await getCurrentUser();

  const { resource: thread } = await threadContainer.item(id, user.id).read<ChatThreadModel>();

  if (!thread || thread.deletedAt !== undefined) {
    notFound();
  }

  const { resources: messages } = await messageContainer.items
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
