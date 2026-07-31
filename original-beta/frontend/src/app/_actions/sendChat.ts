'use server';

import {
  messageContainer,
  ragMessageContainer,
  ragThreadContainer,
  threadContainer,
} from '../../../cosmos';
import { createMessageDocument } from '../_db/message';
import { upsertThreadDocument } from '../_db/thread';
import { SendChatInput, SendChatInputSchema } from '../_schemas/send-chat';
// import { SeasonalEventName } from '../_types/seasonal-event';
import { User } from '../_types/send-chat';
import { getCurrentUser } from '../_utils/auth';
import { getMessage } from '../_utils/message';
// import { getCurrentSeasonalEvent } from '../_utils/seasonal-event';
import { uniqueId } from '../_utils/uniqueId';
import { ActionResponse, ChatResponse, SendChatResponseData } from './types';

async function saveUserMessage(user: User, sendChatInput: SendChatInput) {
  const threadId = sendChatInput.id;
  const userMessage = sendChatInput.messages[sendChatInput.messages.length - 1].content;
  const containers = {
    chat: { thread: threadContainer, message: messageContainer },
    rag: { thread: ragThreadContainer, message: ragMessageContainer },
  };

  const container = containers[sendChatInput.mode];
  if (!container) throw new Error('invalid mode');

  if (sendChatInput.mode === 'chat') {
    await Promise.all([
      !sendChatInput.messages &&
        upsertThreadDocument(container.thread, {
          id: threadId,
          createdAt: new Date(),
          deletedAt: undefined,
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          userDepartmentName: user.departmentName,
          model: sendChatInput.model,
          selectedTemplateId: sendChatInput.templateId,
        }),

      createMessageDocument(container.message, {
        id: uniqueId(),
        createdAt: new Date(),
        threadId,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        userDepartmentName: user.departmentName,
        content: userMessage,
        role: 'user',
        model: sendChatInput.model,
        selectedTemplateId: sendChatInput.templateId,
      }),
    ]);
  }
  if (sendChatInput.mode === 'rag') {
    await Promise.all([
      !sendChatInput.messages &&
        upsertThreadDocument(container.thread, {
          id: threadId,
          createdAt: new Date(),
          deletedAt: undefined,
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          userDepartmentName: user.departmentName,
          model: sendChatInput.model,
          selectedTemplateId: sendChatInput.templateId,
          searchMethod: sendChatInput.searchMethod,
        }),
      createMessageDocument(container.message, {
        id: uniqueId(),
        createdAt: new Date(),
        threadId,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        userDepartmentName: user.departmentName,
        content: userMessage,
        role: 'user',
        model: sendChatInput.model,
        selectedTemplateId: sendChatInput.templateId,
        searchMethod: sendChatInput.searchMethod,
        category: sendChatInput.category,
      }),
    ]);
  }
}

async function chat(sendChatInput: SendChatInput): Promise<Response> {
  const lastHumanMessage = sendChatInput.messages.at(-1)?.content;
  // // 季節イベントメッセージチェック - APIコール前に実行
  // const seasonalEvent = getCurrentSeasonalEvent();
  // if (
  //   seasonalEvent &&
  //   lastHumanMessage?.replace(/\s+/g, '') === seasonalEvent.chat.keyMessage.replace(/\s+/g, '')
  // ) {
  //   // 季節イベントメッセージの場合、APIを呼ばずにモックレスポンスを返す
  //   // 初回メッセージ（messages配列の長さが1）の場合はタイトルを生成
  //   const shouldGenerateTitle = sendChatInput.messages.length === 1;
  //   const threadTitle = shouldGenerateTitle ? seasonalEvent.chat.keyMessage : undefined;

  //   const mockResponse = new Response(
  //     JSON.stringify({
  //       answer: seasonalEvent.chat.content,
  //       chatProcessingTime: 0,
  //       inputTokens: 0,
  //       outputTokens: 0,
  //       chatHistory: [],
  //       threadTitle,
  //       titleInputToken: shouldGenerateTitle ? 0 : undefined,
  //       titleOutputToken: shouldGenerateTitle ? 0 : undefined,
  //       titleResponseTime: shouldGenerateTitle ? 0 : undefined,
  //       log: null,
  //     }),
  //     {
  //       status: 200,
  //       headers: { 'Content-Type': 'application/json' },
  //     }
  //   );
  //   return mockResponse;
  // }
  const pastMessages = sendChatInput.messages.slice(-7); // userとassistantのペアで最大6つのメッセージを保持
  const chatHistory = pastMessages.slice(0, -1).map(({ role, content }) => ({ role, content }));
  const { model, fileName, fileUrl, mediaType } = sendChatInput;

  const chatBody = {
    question: lastHumanMessage,
    model,
    chatHistory,
    fileName,
    fileUrl,
    mediaType,
  };

  const urls = {
    chat: process.env.ORCHESTRATOR_API_URL,
    rag: process.env.ORCHESTRATOR_RAG_API_URL,
  };

  const url = urls[sendChatInput.mode];
  if (!url) throw new Error(`ORCHESTRATOR_${sendChatInput.mode.toUpperCase()}_API_URL is not set`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      sendChatInput.mode === 'rag'
        ? {
            ...chatBody,
            searchMethod: sendChatInput.searchMethod,
            category: sendChatInput.category,
          }
        : chatBody
    ),
  });
  return response;
}

async function saveResponse(
  user: User,
  sendChatInput: SendChatInput,
  chatBackendRes: ChatResponse
) {
  const threadId = sendChatInput.id;
  const model = sendChatInput.model;
  const answer = chatBackendRes.answer;
  const chatProcessingTime = chatBackendRes.chatProcessingTime;
  const inputTokens = chatBackendRes.inputTokens;
  const outputTokens = chatBackendRes.outputTokens;
  const receivedChatHistory = chatBackendRes.chatHistory;
  const selectedIndex = chatBackendRes.selectedIndex;
  const dictionaryId = chatBackendRes.dictionaryId;
  const refAns = chatBackendRes.refAns;
  const refText = chatBackendRes.refText;
  const refText_qa = chatBackendRes.refText_qa;
  const threadTitle = chatBackendRes.threadTitle;
  const containers = {
    chat: { thread: threadContainer, message: messageContainer },
    rag: { thread: ragThreadContainer, message: ragMessageContainer },
  };

  const container = containers[sendChatInput.mode];
  if (!container) throw new Error('invalid mode');
  const log = chatBackendRes.log;
  if (log && log.traceLog && log.traceLog.flow_history) {
    // 画像URLが長くてログを保存できないので削除
    delete log.traceLog.flow_history;
  }

  const now = new Date();
  const commonMessage = {
    id: uniqueId(),
    createdAt: now,
    threadId,
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    userDepartmentName: user.departmentName,
    content: answer,
    role: 'assistant' as const,
    model,
    inputTokens,
    outputTokens,
    chatHistory: receivedChatHistory,
    // seasonalEvent: undefined as SeasonalEventName | undefined,
  };
  const commonThread = {
    id: threadId,
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    userDepartmentName: user.departmentName,
    model,
    updatedAt: now,
    deletedAt: undefined,
  };

  // // イベント中かつ特定のメッセージを入力した場合、特定のメッセージを表示する
  // const seasonalEvent = getCurrentSeasonalEvent();
  // if (seasonalEvent && sendChatInput.messages.at(-1)?.content === seasonalEvent.chat.keyMessage) {
  //   commonMessage = {
  //     ...commonMessage,
  //     content: seasonalEvent.chat.content,
  //     seasonalEvent: seasonalEvent.name,
  //   };
  // }

  if (sendChatInput.mode === 'chat') {
    await createMessageDocument(container.message, {
      ...commonMessage,
      responseTime: chatProcessingTime,
      selectedTemplateId: sendChatInput.templateId,
      log,
    });

    const upsertParams = {
      ...commonThread,
      title: threadTitle,
      titleResponseTime: chatBackendRes.titleResponseTime,
      titleInputToken: chatBackendRes.titleInputToken,
      titleOutputToken: chatBackendRes.titleOutputToken,
      selectedTemplateId: sendChatInput.templateId,
    };

    if (threadTitle !== undefined) {
      await upsertThreadDocument(container.thread, upsertParams);
    } else {
      // 2回目以降のメッセージでもupdatedAtを更新
      try {
        await threadContainer
          .item(threadId, user.id)
          .patch([{ op: 'replace', path: '/updatedAt', value: new Date() }]);
      } catch {
        // updatedAtフィールドが存在しない場合（初回送信失敗時など）はaddで追加
        await threadContainer
          .item(threadId, user.id)
          .patch([{ op: 'add', path: '/updatedAt', value: new Date() }]);
      }
    }
  }

  if (sendChatInput.mode === 'rag') {
    await createMessageDocument(container.message, {
      ...commonMessage,
      category: sendChatInput.category,
      selectedTemplateId: sendChatInput.templateId,
      searchMethod: sendChatInput.searchMethod,
      selectedIndex,
      dictionaryId,
      refAns,
      refText,
      refText_qa,
      decideFuncCallProcessingTime: chatBackendRes.decideFuncCallProcessingTime,
      contextualizedQueryTime: chatBackendRes.contextualizedQueryTime,
      contextualizedQuery: chatBackendRes.contextualizedQuery,
      dictionaryProcessingTime: chatBackendRes.dictionaryProcessingTime,
      correctedQuery: chatBackendRes.correctedQuery,
      embeddingTime: chatBackendRes.embeddingTime,
      qaSearchTime: chatBackendRes.qaSearchTime,
      documentSearchTime: chatBackendRes.documentSearchTime,
      totalSearchTime: chatBackendRes.totalSearchTime,
      answerGenerationTime: chatBackendRes.answerGenerationTime,
      totalApiTime: chatBackendRes.totalApiTime,
      userContentEmbeddingTokens: chatBackendRes.userContentEmbeddingTokens,
    });

    const upsertParams = {
      ...commonThread,
      selectedTemplateId: sendChatInput.templateId,
      searchMethod: chatBackendRes.searchMethod,
      title: threadTitle,
      titleResponseTime: chatBackendRes.titleResponseTime,
      titleInputToken: chatBackendRes.titleInputToken,
      titleOutputToken: chatBackendRes.titleOutputToken,
    };

    if (threadTitle === undefined) {
      try {
        await ragThreadContainer
          .item(threadId, user.id)
          .patch([{ op: 'replace', path: '/updatedAt', value: new Date() }]);
      } catch {
        // updatedAtフィールドが存在しない場合（初回送信失敗時など）はaddで追加
        await ragThreadContainer
          .item(threadId, user.id)
          .patch([{ op: 'add', path: '/updatedAt', value: new Date() }]);
      }
    } else {
      await upsertThreadDocument(container.thread, upsertParams);
    }
  }
}

export async function sendChat(req: SendChatInput): Promise<ActionResponse<SendChatResponseData>> {
  const user = await getCurrentUser();
  if (!user.id) {
    throw new Error(getMessage('E_F_00050'));
  }

  const validate = SendChatInputSchema.safeParse(req);
  if (!validate.success) {
    console.warn('sendChatに不正な入力がありました', { req, errors: validate.error.errors });
    throw new Error(getMessage('E_F_00060'));
  }
  const body = validate.data;

  try {
    await saveUserMessage({ ...user, departmentName: user.departmentName ?? '' }, body);
  } catch (error) {
    console.error('UserMessageの保存に失敗しました', { user, body, error });
    throw new Error(getMessage('E_F_00070'));
  }

  try {
    const answerResponse = await chat(body);
    if (!answerResponse.ok) {
      const errorAnswerResponse = await answerResponse.json();
      console.error('チャットの送信が失敗しました。', errorAnswerResponse);
      throw new Error(errorAnswerResponse.error_message);
    }
    const responseData: ChatResponse = await answerResponse.json();
    await saveResponse({ ...user, departmentName: user.departmentName ?? '' }, body, responseData);

    return {
      data: {
        content: responseData.answer,
        searchResults: responseData.searchResults ?? [],
        receivedFileText: responseData.receivedFileText,
        refAns: responseData.refAns,
        refText: responseData.refText,
        recommend: responseData.recommend,
      },
      success: true,
    };
  } catch (error) {
    // キャッチされたエラーを処理
    let errorMessage = getMessage('E_F_00110', '作成結果');

    if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      // errorがErrorインスタンスでない場合
      errorMessage = String(error);
    }

    return {
      message: errorMessage,
      success: false,
    };
  }
}
