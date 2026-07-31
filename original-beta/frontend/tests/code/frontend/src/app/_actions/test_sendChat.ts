import { sendChat } from '@/app/_actions/sendChat';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { createMessageDocument } from '@/app/_db/message';
import { upsertThreadDocument } from '@/app/_db/thread';
import {
  threadContainer,
  ragThreadContainer,
  messageContainer,
  ragMessageContainer,
} from '~/cosmos';

jest.mock('@/app/_utils/auth');
jest.mock('@/app/_utils/message');
jest.mock('@/app/_db/message');
jest.mock('@/app/_db/thread');
jest.mock('~/cosmos', () => ({
  threadContainer: {
    item: jest.fn(),
  },
  ragThreadContainer: {
    item: jest.fn(),
  },
  messageContainer: {
    items: {
      create: jest.fn(),
    },
  },
  ragMessageContainer: {
    items: {
      create: jest.fn(),
    },
  },
}));

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;
const mockGetMessage = getMessage as jest.MockedFunction<typeof getMessage>;
const mockCreateMessageDocument = createMessageDocument as jest.MockedFunction<
  typeof createMessageDocument
>;
const mockUpsertThreadDocument = upsertThreadDocument as jest.MockedFunction<
  typeof upsertThreadDocument
>;

describe('sendChat', () => {
  const fixedNow = new Date('2026-03-06T12:34:56.000Z');

  beforeEach(() => {
    jest.clearAllMocks();

    jest.useFakeTimers();
    jest.setSystemTime(fixedNow);

    process.env.ORCHESTRATOR_API_URL = 'https://example.com/chat';
    process.env.ORCHESTRATOR_RAG_API_URL = 'https://example.com/rag';

    mockGetMessage.mockImplementation((key: any, ...values: string[]) => {
      const joined = values.length ? `:${values.join(',')}` : '';
      return `MSG:${String(key)}${joined}`;
    });

    mockGetCurrentUser.mockResolvedValue({
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      departmentName: 'Test Department',
    });

    mockCreateMessageDocument.mockResolvedValue({} as any);
    mockUpsertThreadDocument.mockResolvedValue({} as any);

    (global.fetch as any) = jest.fn();

    (threadContainer.item as jest.Mock).mockReturnValue({ patch: jest.fn() });
    (ragThreadContainer.item as jest.Mock).mockReturnValue({ patch: jest.fn() });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function buildChatReq(overrides: Partial<any> = {}) {
    return {
      id: 'thread-1',
      mode: 'chat',
      model: 'gpt-test',
      messages: [{ id: 'm1', role: 'user', content: 'hello' }],
      ...overrides,
    };
  }

  function buildRagReq(overrides: Partial<any> = {}) {
    return {
      id: 'thread-2',
      mode: 'rag',
      model: 'gpt-test',
      searchMethod: 'hybrid',
      category: 'cat-a',
      messages: [{ id: 'm1', role: 'user', content: 'hello' }],
      ...overrides,
    };
  }

  describe('正常系テスト', () => {
    test('N-01-001: chatモードで成功しcontentが返ること（初回メッセージでスレッドupsertされる）', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          answer: 'ANS',
          chatProcessingTime: 1,
          inputTokens: 2,
          outputTokens: 3,
          chatHistory: [],
          threadTitle: 'TITLE',
          titleInputToken: 1,
          titleOutputToken: 1,
          titleResponseTime: 1,
          log: null,
        }),
      });

      const res = await sendChat(buildChatReq({ templateId: 'tpl-1' }));

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.content).toBe('ANS');
      }

      expect(mockUpsertThreadDocument).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ id: 'thread-1', userId: 'user-123' })
      );
      expect(mockCreateMessageDocument).toHaveBeenCalled();
    });

    test('N-01-002: chatモード2回目以降はスレッドupsertされずupdatedAtがpatchされること(replace成功)', async () => {
      const patch = jest.fn().mockResolvedValue({});
      (threadContainer.item as jest.Mock).mockReturnValue({ patch });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          answer: 'ANS',
          chatProcessingTime: 1,
          inputTokens: 2,
          outputTokens: 3,
          chatHistory: [],
          threadTitle: undefined,
          log: null,
        }),
      });

      const req = buildChatReq({
        messages: [
          { id: 'm1', role: 'user', content: 'hello' },
          { id: 'm2', role: 'assistant', content: 'a1' },
          { id: 'm3', role: 'user', content: 'hello2' },
        ],
      });

      const res = await sendChat(req);

      expect(res.success).toBe(true);
      expect(mockUpsertThreadDocument).toHaveBeenCalledTimes(0);
      expect(threadContainer.item).toHaveBeenCalledWith('thread-1', 'user-123');
      expect(patch).toHaveBeenCalledWith([
        { op: 'replace', path: '/updatedAt', value: fixedNow.getTime() },
      ]);
    });

    test('N-01-003: chatモード2回目以降でreplaceが失敗するとaddでpatchされること', async () => {
      const patch = jest
        .fn()
        .mockRejectedValueOnce(new Error('missing updatedAt'))
        .mockResolvedValueOnce({});
      (threadContainer.item as jest.Mock).mockReturnValue({ patch });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          answer: 'ANS',
          chatProcessingTime: 1,
          inputTokens: 2,
          outputTokens: 3,
          chatHistory: [],
          threadTitle: undefined,
          log: null,
        }),
      });

      const req = buildChatReq({
        messages: [
          { id: 'm1', role: 'user', content: 'hello' },
          { id: 'm2', role: 'assistant', content: 'a1' },
          { id: 'm3', role: 'user', content: 'hello2' },
        ],
      });

      const res = await sendChat(req);
      expect(res.success).toBe(true);

      expect(patch).toHaveBeenNthCalledWith(1, [
        { op: 'replace', path: '/updatedAt', value: fixedNow.getTime() },
      ]);
      expect(patch).toHaveBeenNthCalledWith(2, [
        { op: 'add', path: '/updatedAt', value: fixedNow.getTime() },
      ]);
    });

    test('N-02-001: ragモードで成功しsearchResultsがデフォルト空配列になること', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          answer: 'RAG_ANS',
          chatProcessingTime: 1,
          inputTokens: 2,
          outputTokens: 3,
          chatHistory: [],
          threadTitle: 'RAG_TITLE',
          searchMethod: 'hybrid',
          log: null,
        }),
      });

      const res = await sendChat(buildRagReq());

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.content).toBe('RAG_ANS');
        expect(res.data.searchResults).toEqual([]);
      }

      expect(mockUpsertThreadDocument).toHaveBeenCalled();
    });

    test('N-02-002: ragモードでthreadTitleがundefinedの場合updatedAtがpatchされること(replace成功)', async () => {
      const patch = jest.fn().mockResolvedValue({});
      (ragThreadContainer.item as jest.Mock).mockReturnValue({ patch });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          answer: 'RAG_ANS',
          chatProcessingTime: 1,
          inputTokens: 2,
          outputTokens: 3,
          chatHistory: [],
          threadTitle: undefined,
          searchMethod: 'hybrid',
          log: null,
        }),
      });

      const req = buildRagReq({
        messages: [
          { id: 'm1', role: 'user', content: 'hello' },
          { id: 'm2', role: 'assistant', content: 'a1' },
          { id: 'm3', role: 'user', content: 'hello2' },
        ],
      });

      const res = await sendChat(req);

      expect(res.success).toBe(true);
      expect(ragThreadContainer.item).toHaveBeenCalledWith('thread-2', 'user-123');
      expect(patch).toHaveBeenCalledWith([
        { op: 'replace', path: '/updatedAt', value: fixedNow.getTime() },
      ]);
    });

    test('N-02-003: ragモードでreplaceが失敗するとaddでpatchされること', async () => {
      const patch = jest
        .fn()
        .mockRejectedValueOnce(new Error('missing updatedAt'))
        .mockResolvedValueOnce({});
      (ragThreadContainer.item as jest.Mock).mockReturnValue({ patch });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          answer: 'RAG_ANS',
          chatProcessingTime: 1,
          inputTokens: 2,
          outputTokens: 3,
          chatHistory: [],
          threadTitle: undefined,
          searchMethod: 'hybrid',
          log: null,
        }),
      });

      const req = buildRagReq({
        messages: [
          { id: 'm1', role: 'user', content: 'hello' },
          { id: 'm2', role: 'assistant', content: 'a1' },
          { id: 'm3', role: 'user', content: 'hello2' },
        ],
      });

      const res = await sendChat(req);

      expect(res.success).toBe(true);
      expect(patch).toHaveBeenNthCalledWith(1, [
        { op: 'replace', path: '/updatedAt', value: fixedNow.getTime() },
      ]);
      expect(patch).toHaveBeenNthCalledWith(2, [
        { op: 'add', path: '/updatedAt', value: fixedNow.getTime() },
      ]);
    });

    test('N-03-001: chatHistoryが最大6メッセージ（過去7件から最後を除く）に整形されること', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          answer: 'ANS',
          chatProcessingTime: 1,
          inputTokens: 2,
          outputTokens: 3,
          chatHistory: [],
          threadTitle: 'TITLE',
          log: null,
        }),
      });

      const messages = Array.from({ length: 9 }, (_, i) => {
        const idx = i + 1;
        return {
          id: `m${idx}`,
          role: idx % 2 === 0 ? 'assistant' : 'user',
          content: `c${idx}`,
        };
      });
      // 最後は user にする（スキーマ要件）
      messages[messages.length - 1].role = 'user';

      await sendChat(buildChatReq({ messages }));

      const body = (global.fetch as jest.Mock).mock.calls[0][1].body;
      const parsed = JSON.parse(body);
      expect(parsed.chatHistory).toHaveLength(6);
      expect(parsed.question).toBe(`c${messages.length}`);
    });

    test('N-04-001: ragモードではfetch bodyにsearchMethod/categoryが含まれること', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          answer: 'RAG_ANS',
          chatProcessingTime: 1,
          inputTokens: 2,
          outputTokens: 3,
          chatHistory: [],
          threadTitle: 'TITLE',
          searchMethod: 'hybrid',
          log: null,
        }),
      });

      await sendChat(buildRagReq({ category: 'cat-z' }));

      const body = (global.fetch as jest.Mock).mock.calls[0][1].body;
      const parsed = JSON.parse(body);
      expect(parsed.searchMethod).toBe('hybrid');
      expect(parsed.category).toBe('cat-z');
    });

    test('N-05-001: 受信ログにflow_historyがあっても保存前に削除されること', async () => {
      const log = {
        traceLog: {
          flow_history: [{ long: '...very long...' }],
          other: 'ok',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          answer: 'ANS',
          chatProcessingTime: 1,
          inputTokens: 2,
          outputTokens: 3,
          chatHistory: [],
          threadTitle: 'TITLE',
          log,
        }),
      });

      await sendChat(buildChatReq());

      const createCalls = mockCreateMessageDocument.mock.calls;
      const assistantCall = createCalls.find((c) => c[1]?.role === 'assistant');
      expect(assistantCall).toBeTruthy();
      const params = assistantCall![1] as any;
      expect(params.log.traceLog.flow_history).toBeUndefined();
      expect(params.log.traceLog.other).toBe('ok');
    });

    test('N-06-001: saveUserMessageでchatはmessageContainer、ragはragMessageContainerが使われること', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            answer: 'ANS',
            chatProcessingTime: 1,
            inputTokens: 2,
            outputTokens: 3,
            chatHistory: [],
            threadTitle: 'TITLE',
            log: null,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            answer: 'RAG_ANS',
            chatProcessingTime: 1,
            inputTokens: 2,
            outputTokens: 3,
            chatHistory: [],
            threadTitle: 'TITLE',
            searchMethod: 'hybrid',
            log: null,
          }),
        });

      await sendChat(buildChatReq());
      await sendChat(buildRagReq());

      const userCalls = mockCreateMessageDocument.mock.calls.filter((c) => c[1]?.role === 'user');
      expect(userCalls[0][0]).toBe(messageContainer as any);
      expect(userCalls[1][0]).toBe(ragMessageContainer as any);
    });

    test('N-07-001: fileUrl/fileName/mediaTypeを指定した場合、fetch bodyに含まれること', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          answer: 'ANS',
          chatProcessingTime: 1,
          inputTokens: 2,
          outputTokens: 3,
          chatHistory: [],
          threadTitle: 'TITLE',
          log: null,
        }),
      });

      await sendChat(
        buildChatReq({
          fileUrl: 'https://example.com/file',
          fileName: 'file.pdf',
          mediaType: 'application/pdf',
        })
      );

      const body = (global.fetch as jest.Mock).mock.calls[0][1].body;
      const parsed = JSON.parse(body);
      expect(parsed.fileUrl).toBe('https://example.com/file');
      expect(parsed.fileName).toBe('file.pdf');
      expect(parsed.mediaType).toBe('application/pdf');
    });

    test('N-07-002: searchResults/receivedFileTextがレスポンスに含まれる場合、そのまま返却すること', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          answer: 'ANS',
          receivedFileText: 'FILE_TEXT',
          searchResults: [{ id: 1, title: 't', url: 'u', snippet: 's' }],
          chatProcessingTime: 1,
          inputTokens: 2,
          outputTokens: 3,
          chatHistory: [],
          threadTitle: 'TITLE',
          log: null,
        }),
      });

      const res = await sendChat(buildChatReq());
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.searchResults).toEqual([{ id: 1, title: 't', url: 'u', snippet: 's' }]);
        expect(res.data.receivedFileText).toBe('FILE_TEXT');
      }
    });

    test('N-07-003: refAns/refText/recommendがレスポンスに含まれる場合、そのまま返却すること', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          answer: 'ANS',
          refAns: ['a1'],
          refText: ['t1'],
          recommend: ['r1'],
          chatProcessingTime: 1,
          inputTokens: 2,
          outputTokens: 3,
          chatHistory: [],
          threadTitle: 'TITLE',
          log: null,
        }),
      });

      const res = await sendChat(buildChatReq());
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.refAns).toEqual(['a1']);
        expect(res.data.refText).toEqual(['t1']);
        expect(res.data.recommend).toEqual(['r1']);
      }
    });

    test('N-07-004: ragのsaveResponseで付加情報(selectedIndex等)がassistantメッセージに保存されること', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          answer: 'RAG_ANS',
          chatProcessingTime: 1,
          inputTokens: 2,
          outputTokens: 3,
          chatHistory: [],
          threadTitle: 'TITLE',
          searchMethod: 'hybrid',
          selectedIndex: 1,
          dictionaryId: 'dic-1',
          refAns: ['a1'],
          refText: ['t1'],
          refText_qa: ['q1'],
          decideFuncCallProcessingTime: 10,
          contextualizedQueryTime: 11,
          contextualizedQuery: 'cq',
          dictionaryProcessingTime: 12,
          correctedQuery: 'corr',
          embeddingTime: 13,
          qaSearchTime: 14,
          documentSearchTime: 15,
          totalSearchTime: 16,
          answerGenerationTime: 17,
          totalApiTime: 18,
          userContentEmbeddingTokens: 19,
          log: null,
        }),
      });

      await sendChat(buildRagReq());

      const assistantCall = mockCreateMessageDocument.mock.calls.find(
        (c) => c[1]?.role === 'assistant'
      );
      expect(assistantCall).toBeTruthy();
      expect(assistantCall![1]).toEqual(
        expect.objectContaining({
          selectedIndex: 1,
          dictionaryId: 'dic-1',
          refAns: ['a1'],
          refText: ['t1'],
          refText_qa: ['q1'],
          totalApiTime: 18,
          userContentEmbeddingTokens: 19,
        })
      );
    });
  });

  describe('異常系テスト', () => {
    test('E-01-001: user.idが無い場合は例外になること', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: '',
        name: 'NoId',
        email: 'x@example.com',
        departmentName: null as any,
      });

      await expect(sendChat(buildChatReq())).rejects.toThrow('MSG:E_F_00050');
    });

    test('E-02-001: スキーマバリデーションに失敗した場合は例外になること', async () => {
      const invalid = buildChatReq({ messages: [] });
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await expect(sendChat(invalid as any)).rejects.toThrow('MSG:E_F_00060');
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    test('E-03-001: ユーザーメッセージ保存に失敗した場合は例外になること', async () => {
      mockCreateMessageDocument.mockRejectedValue(new Error('save failed'));
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(sendChat(buildChatReq())).rejects.toThrow('MSG:E_F_00070');
      expect(errorSpy).toHaveBeenCalled();

      errorSpy.mockRestore();
    });

    test('E-04-001: ORCHESTRATOR_API_URL未設定の場合は失敗レスポンスになること', async () => {
      delete process.env.ORCHESTRATOR_API_URL;

      const res = await sendChat(buildChatReq());

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.message).toContain('ORCHESTRATOR_CHAT_API_URL is not set');
      }
    });

    test('E-05-001: fetchがok=falseの場合はerror_messageを返すこと', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({ error_message: 'backend error' }),
      });

      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const res = await sendChat(buildChatReq());

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.message).toBe('backend error');
      }
      expect(errorSpy).toHaveBeenCalled();

      errorSpy.mockRestore();
    });

    test('E-06-001: fetchがstringでrejectした場合はstringをmessageにして返すこと', async () => {
      (global.fetch as jest.Mock).mockRejectedValue('network down');

      const res = await sendChat(buildChatReq());

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.message).toBe('network down');
      }
    });

    test('E-07-001: saveResponseが失敗した場合は失敗レスポンスになること', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          answer: 'ANS',
          chatProcessingTime: 1,
          inputTokens: 2,
          outputTokens: 3,
          chatHistory: [],
          threadTitle: 'TITLE',
          log: null,
        }),
      });
      mockCreateMessageDocument.mockImplementationOnce(async () => ({}) as any); // user保存
      mockCreateMessageDocument.mockRejectedValueOnce(new Error('saveResponse failed')); // assistant保存

      const res = await sendChat(buildChatReq());

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.message).toBe('saveResponse failed');
      }
    });

    test('E-08-001: ORCHESTRATOR_RAG_API_URL未設定の場合は失敗レスポンスになること', async () => {
      delete process.env.ORCHESTRATOR_RAG_API_URL;

      const res = await sendChat(buildRagReq());

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.message).toContain('ORCHESTRATOR_RAG_API_URL is not set');
      }
    });

    test('E-09-001: ok=false時のerrorレスポンスjsonが失敗した場合はその例外メッセージを返すこと', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: jest.fn().mockRejectedValue(new Error('bad json')),
      });

      const res = await sendChat(buildChatReq());
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.message).toBe('bad json');
      }
    });

    test('E-10-001: ok=trueでもanswer jsonが失敗した場合はその例外メッセージを返すこと', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('bad json')),
      });

      const res = await sendChat(buildChatReq());
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.message).toBe('bad json');
      }
    });

    test('E-11-001: saveResponse内のupsertThreadDocumentが失敗した場合は失敗レスポンスになること', async () => {
      // saveUserMessageでupsertThreadDocumentを呼ばないよう messages.length > 1
      const req = buildChatReq({
        messages: [
          { id: 'm1', role: 'user', content: 'hello' },
          { id: 'm2', role: 'assistant', content: 'a1' },
          { id: 'm3', role: 'user', content: 'hello2' },
        ],
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          answer: 'ANS',
          chatProcessingTime: 1,
          inputTokens: 2,
          outputTokens: 3,
          chatHistory: [],
          threadTitle: 'TITLE',
          log: null,
        }),
      });
      mockUpsertThreadDocument.mockRejectedValueOnce(new Error('upsert failed'));

      const res = await sendChat(req);

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.message).toBe('upsert failed');
      }
    });

    test('E-12-001: updatedAt patchのreplace/addがどちらも失敗した場合は失敗レスポンスになること', async () => {
      const patch = jest.fn().mockRejectedValue(new Error('patch failed'));
      (threadContainer.item as jest.Mock).mockReturnValue({ patch });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          answer: 'ANS',
          chatProcessingTime: 1,
          inputTokens: 2,
          outputTokens: 3,
          chatHistory: [],
          threadTitle: undefined,
          log: null,
        }),
      });

      const req = buildChatReq({
        messages: [
          { id: 'm1', role: 'user', content: 'hello' },
          { id: 'm2', role: 'assistant', content: 'a1' },
          { id: 'm3', role: 'user', content: 'hello2' },
        ],
      });

      const res = await sendChat(req);

      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.message).toBe('patch failed');
      }
      expect(patch).toHaveBeenCalledTimes(2);
    });
  });

  describe('境界系テスト', () => {
    test('L-01-001: departmentNameがundefinedでも保存処理が実行されること', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        departmentName: undefined,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          answer: 'ANS',
          chatProcessingTime: 1,
          inputTokens: 2,
          outputTokens: 3,
          chatHistory: [],
          threadTitle: 'TITLE',
          log: null,
        }),
      });

      const res = await sendChat(buildChatReq());
      expect(res.success).toBe(true);

      const userCall = mockCreateMessageDocument.mock.calls.find((c) => c[1]?.role === 'user');
      expect(userCall).toBeTruthy();
      expect((userCall![1] as any).userDepartmentName).toBe('');
    });

    test('L-02-001: categoryが未指定のragでも送信できること', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          answer: 'RAG_ANS',
          chatProcessingTime: 1,
          inputTokens: 2,
          outputTokens: 3,
          chatHistory: [],
          threadTitle: 'TITLE',
          searchMethod: 'hybrid',
          log: null,
        }),
      });

      const res = await sendChat(buildRagReq({ category: undefined }));
      expect(res.success).toBe(true);
    });

    test('L-03-001: messagesが1件の場合、chatHistoryが空配列になること', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          answer: 'ANS',
          chatProcessingTime: 1,
          inputTokens: 2,
          outputTokens: 3,
          chatHistory: [],
          threadTitle: 'TITLE',
          log: null,
        }),
      });

      await sendChat(buildChatReq({ messages: [{ id: 'm1', role: 'user', content: 'only' }] }));

      const body = (global.fetch as jest.Mock).mock.calls[0][1].body;
      const parsed = JSON.parse(body);
      expect(parsed.chatHistory).toEqual([]);
      expect(parsed.question).toBe('only');
    });

    test('L-04-001: messagesがちょうど7件の場合、chatHistoryが6件になること', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          answer: 'ANS',
          chatProcessingTime: 1,
          inputTokens: 2,
          outputTokens: 3,
          chatHistory: [],
          threadTitle: 'TITLE',
          log: null,
        }),
      });

      const messages = Array.from({ length: 7 }, (_, i) => ({
        id: `m${i + 1}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `c${i + 1}`,
      }));
      messages[messages.length - 1].role = 'user';

      await sendChat(buildChatReq({ messages }));

      const body = (global.fetch as jest.Mock).mock.calls[0][1].body;
      const parsed = JSON.parse(body);
      expect(parsed.chatHistory).toHaveLength(6);
      expect(parsed.question).toBe('c7');
    });

    test('L-05-001: templateIdが未指定でも正常に送信できること', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          answer: 'ANS',
          chatProcessingTime: 1,
          inputTokens: 2,
          outputTokens: 3,
          chatHistory: [],
          threadTitle: 'TITLE',
          log: null,
        }),
      });

      const res = await sendChat(buildChatReq({ templateId: undefined }));
      expect(res.success).toBe(true);

      const userCall = mockCreateMessageDocument.mock.calls.find((c) => c[1]?.role === 'user');
      expect(userCall).toBeTruthy();
      expect((userCall![1] as any).selectedTemplateId).toBeUndefined();
    });

    test('L-06-001: ragでcategoryがundefinedの場合、fetch bodyにcategoryキーが含まれないこと', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          answer: 'RAG_ANS',
          chatProcessingTime: 1,
          inputTokens: 2,
          outputTokens: 3,
          chatHistory: [],
          threadTitle: 'TITLE',
          searchMethod: 'hybrid',
          log: null,
        }),
      });

      await sendChat(buildRagReq({ category: undefined }));

      const body = (global.fetch as jest.Mock).mock.calls[0][1].body;
      const parsed = JSON.parse(body);
      expect(parsed.searchMethod).toBe('hybrid');
      expect(Object.prototype.hasOwnProperty.call(parsed, 'category')).toBe(false);
    });
  });

  describe('モジュール疎通系テスト', () => {
    test('I-01-001: 認証→保存→fetch→保存→結果返却の一連が成立すること(chat)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          answer: 'ANS',
          chatProcessingTime: 1,
          inputTokens: 2,
          outputTokens: 3,
          chatHistory: [],
          threadTitle: 'TITLE',
          log: null,
        }),
      });

      const res = await sendChat(buildChatReq());

      expect(mockGetCurrentUser).toHaveBeenCalled();
      expect(mockCreateMessageDocument).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalled();
      expect(res.success).toBe(true);
    });

    test('I-02-001: modeが不正の場合、saveUserMessageでinvalid modeになりE_F_00070で例外になること（疎通/防衛確認）', async () => {
      // スキーマの制約を回避するため、safeParseを強制成功させたモジュールを再importする
      jest.resetModules();

      jest.doMock('@/app/_utils/auth', () => ({
        getCurrentUser: jest.fn().mockResolvedValue({
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          departmentName: 'Test Department',
        }),
      }));
      jest.doMock('@/app/_utils/message', () => ({
        getMessage: jest.fn((key: any, ...values: string[]) => {
          const joined = values.length ? `:${values.join(',')}` : '';
          return `MSG:${String(key)}${joined}`;
        }),
      }));
      jest.doMock('@/app/_db/message', () => ({
        createMessageDocument: jest.fn().mockResolvedValue({}),
      }));
      jest.doMock('@/app/_db/thread', () => ({
        upsertThreadDocument: jest.fn().mockResolvedValue({}),
      }));
      jest.doMock('~/cosmos', () => ({
        threadContainer: { item: jest.fn() },
        ragThreadContainer: { item: jest.fn() },
        messageContainer: { items: { create: jest.fn() } },
        ragMessageContainer: { items: { create: jest.fn() } },
      }));
      jest.doMock('@/app/_schemas/send-chat', () => ({
        SendChatInputSchema: {
          safeParse: jest.fn().mockReturnValue({
            success: true,
            data: {
              id: 'thread-x',
              mode: 'invalid',
              model: 'gpt-test',
              messages: [{ id: 'm1', role: 'user', content: 'hello' }],
            },
          }),
        },
      }));

      process.env.ORCHESTRATOR_API_URL = 'https://example.com/chat';
      (global.fetch as any) = jest.fn();

      const { sendChat: reimportedSendChat } = await import('@/app/_actions/sendChat');

      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await expect(reimportedSendChat(buildChatReq() as any)).rejects.toThrow('MSG:E_F_00070');
      errorSpy.mockRestore();
    });

    test('I-03-001: modeが途中で不正になった場合、saveResponseでinvalid modeとなり失敗レスポンスになること', async () => {
      jest.resetModules();

      jest.doMock('@/app/_utils/auth', () => ({
        getCurrentUser: jest.fn().mockResolvedValue({
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          departmentName: 'Test Department',
        }),
      }));
      jest.doMock('@/app/_utils/message', () => ({
        getMessage: jest.fn((key: any, ...values: string[]) => {
          const joined = values.length ? `:${values.join(',')}` : '';
          return `MSG:${String(key)}${joined}`;
        }),
      }));
      jest.doMock('@/app/_db/message', () => ({
        createMessageDocument: jest.fn().mockResolvedValue({}),
      }));
      jest.doMock('@/app/_db/thread', () => ({
        upsertThreadDocument: jest.fn().mockResolvedValue({}),
      }));
      jest.doMock('~/cosmos', () => ({
        threadContainer: { item: jest.fn().mockReturnValue({ patch: jest.fn() }) },
        ragThreadContainer: { item: jest.fn().mockReturnValue({ patch: jest.fn() }) },
        messageContainer: { items: { create: jest.fn() } },
        ragMessageContainer: { items: { create: jest.fn() } },
      }));

      let modeReads = 0;
      const data: any = {
        id: 'thread-1',
        model: 'gpt-test',
        templateId: 'tpl-1',
        messages: [{ id: 'm1', role: 'user', content: 'hello' }],
        get mode() {
          modeReads += 1;
          // saveUserMessage(3回) + chat(2回) の参照まではchat
          return modeReads <= 5 ? 'chat' : 'invalid';
        },
      };

      jest.doMock('@/app/_schemas/send-chat', () => ({
        SendChatInputSchema: {
          safeParse: jest.fn().mockReturnValue({ success: true, data }),
        },
      }));

      process.env.ORCHESTRATOR_API_URL = 'https://example.com/chat';
      (global.fetch as any) = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          answer: 'ANS',
          chatProcessingTime: 1,
          inputTokens: 2,
          outputTokens: 3,
          chatHistory: [],
          threadTitle: 'TITLE',
          log: null,
        }),
      });

      const { sendChat: reimportedSendChat } = await import('@/app/_actions/sendChat');

      const res = await reimportedSendChat(buildChatReq() as any);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.message).toBe('invalid mode');
      }
    });
  });
});
