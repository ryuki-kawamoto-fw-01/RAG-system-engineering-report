'use server';

import { CHAT_API_ERROR_MSG, DB_ERROR_MSG, INPUT_ERROR_MSG, USER_ERROR_MSG } from '../../../config';
import { deepMessageContainer, deepThreadContainer } from '../../../cosmos';
import { createMessageDocument } from '../_db/message';
import { upsertThreadDocument } from '../_db/thread';
import {
  SendDeepResearchInput,
  SendDeepResearchInputSchema,
} from '../_schemas/send-deep-research-chat';
import { User } from '../_types/send-chat';
import { getCurrentUser } from '../_utils/auth';
import { uniqueId } from '../_utils/uniqueId';
import { getInstanceId, getResult } from './chatDeepResearch';
import { ActionResponse, DeepResearchResponse, SendDeepResearchResponseData } from './types';

async function saveUserMessage(user: User, sendInput: SendDeepResearchInput) {
  const threadId = sendInput.id;
  const userMessage = sendInput.messages[sendInput.messages.length - 1].content;
  const containers = {
    'deep-research': { thread: deepThreadContainer, message: deepMessageContainer },
  };

  const container = containers['deep-research'];
  if (!container) throw new Error('invalid mode');

  await Promise.all([
    !sendInput.messages &&
      upsertThreadDocument(container.thread, {
        id: threadId,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
      }),

    createMessageDocument(container.message, {
      id: uniqueId(),
      createdAt: new Date(),
      threadId,
      chatThreadId: threadId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      content: userMessage,
      role: 'user',
    }),
  ]);
}

async function saveResponse(
  user: User,
  sendDeepResearchInput: SendDeepResearchInput,
  deepResearchBackendRes: DeepResearchResponse
) {
  const threadId = sendDeepResearchInput.id;
  const answer = deepResearchBackendRes.content;
  const searchResults = deepResearchBackendRes.searchResults;
  const container = {
    'deep-research': { thread: deepThreadContainer, message: deepMessageContainer },
  };

  const commonMessage = {
    id: uniqueId(),
    createdAt: new Date(),
    threadId,
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    content: answer,
    role: 'assistant' as const,
  };

  const commonThread = {
    id: threadId,
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
  };

  await createMessageDocument(container['deep-research'].message, {
    ...commonMessage,
    content: answer,
    searchResults,
    role: 'assistant',
  });

  await upsertThreadDocument(container['deep-research'].thread, commonThread);
}

export async function startDeepResearchChat(
  input: SendDeepResearchInput
): Promise<ActionResponse<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user.id) {
    return { success: false, message: USER_ERROR_MSG };
  }

  const validate = SendDeepResearchInputSchema.safeParse(input);
  if (!validate.success) {
    console.warn('startDeepResearchChat validation error', {
      input,
      errors: validate.error.errors,
    });
    return { success: false, message: INPUT_ERROR_MSG };
  }

  const body = validate.data;

  try {
    await saveUserMessage(user, body);
  } catch (error) {
    console.error('ユーザーメッセージの保存に失敗', { user, body, error });
    return { success: false, message: DB_ERROR_MSG };
  }

  try {
    const id = await getInstanceId(body);
    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    console.error('インスタンスID取得失敗', error);
    return { success: false, message: CHAT_API_ERROR_MSG };
  }
}

export async function sendDeepResearchChat(
  instanceId: string,
  req: SendDeepResearchInput
): Promise<ActionResponse<SendDeepResearchResponseData>> {
  const user = await getCurrentUser();
  if (!user.id) {
    return { success: false, message: USER_ERROR_MSG };
  }

  const validate = SendDeepResearchInputSchema.safeParse(req);
  if (!validate.success) {
    console.warn('startDeepResearchChat validation error', {
      req,
      errors: validate.error.errors,
    });
    return { success: false, message: INPUT_ERROR_MSG };
  }

  const body = validate.data;

  try {
    const resultRes = await getResult(instanceId);
    if (!resultRes.ok) {
      const errorBody = await resultRes.json();
      return { success: false, message: errorBody.error };
    }
    const resultData: DeepResearchResponse = await resultRes.json();

    if (resultRes.status === 202) {
      return {
        success: true,
        data: {
          content: resultData.content,
          searchResults: [],
        },
      };
    }
    await saveResponse(user, body, resultData);

    return {
      success: true,
      data: {
        content: resultData.content,
        searchResults: resultData.searchResults ?? [],
      },
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: CHAT_API_ERROR_MSG };
  }
}
