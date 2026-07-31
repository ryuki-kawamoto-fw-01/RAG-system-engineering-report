'use server';

import 'server-only';
import { Container } from '@azure/cosmos';
import { ChatType } from '@/app/_types/chat-type';
import { getCurrentUser } from '@/app/_utils/auth';
import { ChatThreadModel } from '../../../../config';
import {
  agentThreadContainer,
  threadContainer as chatThreadContainer,
  ragThreadContainer,
} from '../../../../cosmos';

export async function getChatThreads(type: ChatType) {
  const user = await getCurrentUser();
  let threadContainer: Container | null = null;
  if (type === ChatType.Chat) {
    threadContainer = chatThreadContainer;
  } else if (type === ChatType.RagChat) {
    threadContainer = ragThreadContainer;
  } else if (type === ChatType.Agent) {
    threadContainer = agentThreadContainer;
  } else {
    throw new Error('Invalid target parameter');
  }

  const { resources: threads } = await threadContainer.items
    .query<ChatThreadModel>({
      query:
        'SELECT * FROM c WHERE c.userId = @userId AND NOT IS_DEFINED(c.deletedAt) ORDER BY c.updatedAt DESC',
      parameters: [{ name: '@userId', value: user.id }],
    })
    .fetchAll();

  return {
    threads,
  };
}
