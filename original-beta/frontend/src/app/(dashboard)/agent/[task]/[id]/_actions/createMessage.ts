'use server';

import { createMessageDocument } from '@/app/_db/message';
import { upsertThreadDocument } from '@/app/_db/thread';
import { getCurrentUser } from '@/app/_utils/auth';
import { uniqueId } from '@/app/_utils/uniqueId';
import { agentMessageContainer, agentThreadContainer } from '../../../../../../../cosmos';
import { CreateMessageInput } from '../../_actions/schema';

export async function createMessage(createMessageInput: CreateMessageInput) {
  const user = await getCurrentUser();
  const threadId = createMessageInput.threadId;
  const container = {
    thread: agentThreadContainer,
    message: agentMessageContainer,
  };
  const message = createMessageInput.message;
  const now = new Date();
  await Promise.all([
    upsertThreadDocument(container.thread, {
      id: threadId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      title: message.content.slice(0, 100),
      model: createMessageInput.model,
      updatedAt: now,
    }),
    createMessageDocument(container.message, {
      id: uniqueId(),
      createdAt: now,
      threadId,
      chatThreadId: threadId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      content: message.content,
      role: message.role,
      model: createMessageInput.model,
      category: createMessageInput.category,
    }),
  ]);
}
