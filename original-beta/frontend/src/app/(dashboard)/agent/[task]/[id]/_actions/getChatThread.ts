'use server';

import { getCurrentUser } from '@/app/_utils/auth';
import 'server-only';
import { agentMessageContainer, agentThreadContainer } from '../../../../../../../cosmos';
import { AgentChatThreadModel } from '../../_actions/type';

export async function getChatThread(id: string) {
  const user = await getCurrentUser();

  const { resource: thread } = await agentThreadContainer
    .item(id, user.id)
    .read<AgentChatThreadModel>();

  if (!thread || thread.deletedAt !== undefined) {
    return null;
  }

  const { resources: messages } = await agentMessageContainer.items
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
    thread,
  };
}
