import { BulkOperationType } from '@azure/cosmos';
import { clearChatThreads } from '@/app/_actions/chat/clearChatThreads';
import { ChatType } from '@/app/_types/chat-type';
import { getCurrentUser } from '@/app/_utils/auth';
import { threadContainer, ragThreadContainer, agentThreadContainer } from '~/cosmos';

jest.mock('@/app/_utils/auth');
jest.mock('~/cosmos', () => ({
  threadContainer: {
    items: {
      query: jest.fn(),
      bulk: jest.fn(),
    },
  },
  ragThreadContainer: {
    items: {
      query: jest.fn(),
      bulk: jest.fn(),
    },
  },
  agentThreadContainer: {
    items: {
      query: jest.fn(),
      bulk: jest.fn(),
    },
  },
}));

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;

describe('clearChatThreads', () => {
  const fixedNow = new Date('2026-03-06T12:34:56.000Z');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(fixedNow);

    mockGetCurrentUser.mockResolvedValue({
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      departmentName: 'Test Department',
    });

    // デフォルト: 0件
    (threadContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockResolvedValue({ resources: [] }),
    });
    (ragThreadContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockResolvedValue({ resources: [] }),
    });
    (agentThreadContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockResolvedValue({ resources: [] }),
    });

    (threadContainer.items.bulk as jest.Mock).mockResolvedValue([]);
    (ragThreadContainer.items.bulk as jest.Mock).mockResolvedValue([]);
    (agentThreadContainer.items.bulk as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('正常系テスト', () => {
    test('N-01-001: 0件でも成功しbulkが呼ばれないこと(Chat)', async () => {
      const res = await clearChatThreads(ChatType.Chat);
      expect(res.success).toBe(true);
      expect(threadContainer.items.bulk).not.toHaveBeenCalled();
    });

    test('N-01-002: 1件の場合bulkが1回呼ばれdeletedAtが付与されること', async () => {
      const threads = [{ id: 't-1', userId: 'user-123', createdAt: fixedNow } as any];
      (threadContainer.items.query as jest.Mock).mockReturnValue({
        fetchAll: jest.fn().mockResolvedValue({ resources: threads }),
      });

      const res = await clearChatThreads(ChatType.Chat);

      expect(res.success).toBe(true);
      expect(threadContainer.items.bulk).toHaveBeenCalledTimes(1);
      const operations = (threadContainer.items.bulk as jest.Mock).mock.calls[0][0];
      expect(operations).toHaveLength(1);
      expect(operations[0]).toEqual(
        expect.objectContaining({
          operationType: BulkOperationType.Upsert,
          id: 't-1',
          resourceBody: expect.objectContaining({
            id: 't-1',
            deletedAt: fixedNow.getTime(),
          }),
        })
      );
    });

    test('N-01-003: 51件の場合50件+1件でbulkが2回呼ばれること', async () => {
      const threads = Array.from({ length: 51 }, (_, i) => ({
        id: `t-${i + 1}`,
        userId: 'user-123',
        createdAt: fixedNow,
      })) as any[];

      (ragThreadContainer.items.query as jest.Mock).mockReturnValue({
        fetchAll: jest.fn().mockResolvedValue({ resources: threads }),
      });

      const res = await clearChatThreads(ChatType.RagChat);

      expect(res.success).toBe(true);
      expect(ragThreadContainer.items.bulk).toHaveBeenCalledTimes(2);
      expect((ragThreadContainer.items.bulk as jest.Mock).mock.calls[0][0]).toHaveLength(50);
      expect((ragThreadContainer.items.bulk as jest.Mock).mock.calls[1][0]).toHaveLength(1);
    });
  });

  describe('異常系テスト', () => {
    test('E-01-001: 無効なチャットタイプの場合は失敗すること', async () => {
      const res = await clearChatThreads('invalid-type' as ChatType);
      expect(res.success).toBe(false);
      expect(res.message).toBe('無効なパラメータです');
    });

    test('E-02-001: queryが失敗した場合は失敗し汎用メッセージを返すこと', async () => {
      (threadContainer.items.query as jest.Mock).mockReturnValue({
        fetchAll: jest.fn().mockRejectedValue(new Error('query error')),
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const res = await clearChatThreads(ChatType.Chat);

      expect(res.success).toBe(false);
      expect(res.message).toBe('予期せぬエラーが発生しました');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    test('E-03-001: bulkが失敗した場合は失敗し汎用メッセージを返すこと', async () => {
      const threads = Array.from({ length: 2 }, (_, i) => ({
        id: `t-${i + 1}`,
        userId: 'user-123',
        createdAt: fixedNow,
      })) as any[];

      (agentThreadContainer.items.query as jest.Mock).mockReturnValue({
        fetchAll: jest.fn().mockResolvedValue({ resources: threads }),
      });
      (agentThreadContainer.items.bulk as jest.Mock).mockRejectedValue(new Error('bulk error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const res = await clearChatThreads(ChatType.Agent);

      expect(res.success).toBe(false);
      expect(res.message).toBe('予期せぬエラーが発生しました');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('境界系テスト', () => {
    test('L-01-001: ちょうど50件の場合bulkが1回だけ呼ばれること', async () => {
      const threads = Array.from({ length: 50 }, (_, i) => ({
        id: `t-${i + 1}`,
        userId: 'user-123',
        createdAt: fixedNow,
      })) as any[];

      (threadContainer.items.query as jest.Mock).mockReturnValue({
        fetchAll: jest.fn().mockResolvedValue({ resources: threads }),
      });

      const res = await clearChatThreads(ChatType.Chat);

      expect(res.success).toBe(true);
      expect(threadContainer.items.bulk).toHaveBeenCalledTimes(1);
      expect((threadContainer.items.bulk as jest.Mock).mock.calls[0][0]).toHaveLength(50);
    });

    test('L-02-001: 49件の場合bulkが1回だけ呼ばれること', async () => {
      const threads = Array.from({ length: 49 }, (_, i) => ({
        id: `t-${i + 1}`,
        userId: 'user-123',
        createdAt: fixedNow,
      })) as any[];

      (threadContainer.items.query as jest.Mock).mockReturnValue({
        fetchAll: jest.fn().mockResolvedValue({ resources: threads }),
      });

      const res = await clearChatThreads(ChatType.Chat);

      expect(res.success).toBe(true);
      expect(threadContainer.items.bulk).toHaveBeenCalledTimes(1);
      expect((threadContainer.items.bulk as jest.Mock).mock.calls[0][0]).toHaveLength(49);
    });
  });

  describe('モジュール疎通系テスト', () => {
    test('I-01-001: getCurrentUserのuserIdでクエリパラメータが設定されること', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: 'user-integrated',
        name: 'Integrated',
        email: 'i@example.com',
        departmentName: 'Dept',
      });

      const fetchAll = jest.fn().mockResolvedValue({ resources: [] });
      (threadContainer.items.query as jest.Mock).mockReturnValue({ fetchAll });

      const res = await clearChatThreads(ChatType.Chat);
      expect(res.success).toBe(true);
      expect(threadContainer.items.query).toHaveBeenCalledWith({
        query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC',
        parameters: [{ name: '@userId', value: 'user-integrated' }],
      });
    });
  });
});
