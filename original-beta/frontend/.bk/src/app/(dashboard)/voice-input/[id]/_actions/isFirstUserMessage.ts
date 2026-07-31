'use server';

import 'server-only';
import { voiceMessageContainer } from '../../../../../../cosmos';

export async function isFirstUserMessage(threadId: string): Promise<boolean> {
  try {
    const query = {
      query: "SELECT * FROM c WHERE c.threadId = @threadId AND c.role = 'user'",
      parameters: [
        {
          name: '@threadId',
          value: threadId,
        },
      ],
    };

    const response = await voiceMessageContainer.items.query(query).fetchAll();

    return response.resources.length === 0;
  } catch (error) {
    console.error('Error checking for first user message:', error);
    return false;
  }
}
