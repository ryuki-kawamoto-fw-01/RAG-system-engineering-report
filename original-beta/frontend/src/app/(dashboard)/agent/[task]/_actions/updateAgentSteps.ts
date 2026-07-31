'use server';

import { getCurrentUser } from '@/app/_utils/auth';
import { agentThreadContainer } from '../../../../../../cosmos';
import { UpdateAgentStepsInput, UpdateAgentStepsSchema } from './schema';
import { AgentChatThreadModel } from './type';

export async function updateAgentSteps(input: UpdateAgentStepsInput): Promise<void> {
  try {
    const safeInput = UpdateAgentStepsSchema.safeParse(input);
    if (!safeInput.success) {
      throw new Error('不正な入力です');
    }
    const user = await getCurrentUser();
    const { threadId, agentSteps } = safeInput.data;

    const { resource: thread } = await agentThreadContainer
      .item(threadId, user.id)
      .read<AgentChatThreadModel>();

    if (!thread) {
      console.error(`Thread not found ${threadId}`);
      throw new Error('Thread not found');
    }

    thread.agentSteps = agentSteps;

    await agentThreadContainer.item(threadId, user.id).replace(thread);
  } catch (error) {
    console.error(error);
    throw new Error('Failed to update agent steps');
  }
}
