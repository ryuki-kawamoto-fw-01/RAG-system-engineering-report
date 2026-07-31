import { getChatThreads } from '@/app/_actions/chat/getChatThreads';
import { ChatType } from '@/app/_types/chat-type';
import { getCurrentUser } from '@/app/_utils/auth';
import {
  agentThreadContainer,
  threadContainer as chatThreadContainer,
  ragThreadContainer,
} from '~/cosmos';

jest.mock('@/app/_utils/auth');
jest.mock('~/cosmos', () => ({
  agentThreadContainer: {
    items: {
      query: jest.fn(),
    },
  },
  threadContainer: {
    items: {
      query: jest.fn(),
    },
  },
  ragThreadContainer: {
    items: {
      query: jest.fn(),
    },
  },
}));

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;

describe('getChatThreads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue({
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      departmentName: 'Dept',
    });

    (chatThreadContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockResolvedValue({ resources: [] }),
    });
    (ragThreadContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockResolvedValue({ resources: [] }),
    });
    (agentThreadContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockResolvedValue({ resources: [] }),
    });
  });

  describe('正常系テスト', () => {
    test('N-01-001: Chatタイプでスレッド一覧が取得できること', async () => {
      const threads = [{ id: 't-1' }, { id: 't-2' }];
      const fetchAll = jest.fn().mockResolvedValue({ resources: threads });
      (chatThreadContainer.items.query as jest.Mock).mockReturnValue({ fetchAll });

      const res = await getChatThreads(ChatType.Chat);

      expect(res.threads).toEqual(threads);
      expect(chatThreadContainer.items.query).toHaveBeenCalledWith({
        query:
          'SELECT * FROM c WHERE c.userId = @userId AND NOT IS_DEFINED(c.deletedAt) ORDER BY c.createdAt DESC',
        parameters: [{ name: '@userId', value: 'user-123' }],
      });
    });

    test('N-01-002: RagChatタイプでスレッド一覧が取得できること', async () => {
      const threads = [{ id: 'rt-1' }];
      const fetchAll = jest.fn().mockResolvedValue({ resources: threads });
      (ragThreadContainer.items.query as jest.Mock).mockReturnValue({ fetchAll });

      const res = await getChatThreads(ChatType.RagChat);

      expect(res.threads).toEqual(threads);
      expect(ragThreadContainer.items.query).toHaveBeenCalled();
    });

    test('N-01-003: Agentタイプでスレッド一覧が取得できること', async () => {
      const threads = [{ id: 'at-1' }];
      const fetchAll = jest.fn().mockResolvedValue({ resources: threads });
      (agentThreadContainer.items.query as jest.Mock).mockReturnValue({ fetchAll });

      const res = await getChatThreads(ChatType.Agent);

      expect(res.threads).toEqual(threads);
      expect(agentThreadContainer.items.query).toHaveBeenCalled();
    });
  });

  describe('異常系テスト', () => {
    test('E-01-001: 無効なタイプの場合は例外になること', async () => {
      await expect(getChatThreads('invalid-type' as ChatType)).rejects.toThrow(
        'Invalid target parameter'
      );
    });

    test('E-02-001: fetchAllが失敗した場合は例外が伝播すること', async () => {
      (chatThreadContainer.items.query as jest.Mock).mockReturnValue({
        fetchAll: jest.fn().mockRejectedValue(new Error('fetch error')),
      });

      await expect(getChatThreads(ChatType.Chat)).rejects.toThrow('fetch error');
    });
  });

  describe('境界系テスト', () => {
    test('L-01-001: userIdが空文字でもクエリが実行されること（実装依存の確認）', async () => {
      mockGetCurrentUser.mockResolvedValue({
        id: '',
        name: 'Empty',
        email: 'e@example.com',
        departmentName: 'Dept',
      });

      await getChatThreads(ChatType.Chat);

      expect(chatThreadContainer.items.query).toHaveBeenCalledWith({
        query:
          'SELECT * FROM c WHERE c.userId = @userId AND NOT IS_DEFINED(c.deletedAt) ORDER BY c.createdAt DESC',
        parameters: [{ name: '@userId', value: '' }],
      });
    });

    test('L-02-001: 取得結果が0件の場合、空配列を返すこと', async () => {
      (chatThreadContainer.items.query as jest.Mock).mockReturnValue({
        fetchAll: jest.fn().mockResolvedValue({ resources: [] }),
      });

      const res = await getChatThreads(ChatType.Chat);
      expect(res.threads).toEqual([]);
    });
  });

  describe('モジュール疎通系テスト', () => {
    test('I-01-001: 認証→コンテナ選択→クエリ→返却の流れが成立すること', async () => {
      const threads = [{ id: 't-1' }];
      (chatThreadContainer.items.query as jest.Mock).mockReturnValue({
        fetchAll: jest.fn().mockResolvedValue({ resources: threads }),
      });

      const res = await getChatThreads(ChatType.Chat);

      expect(mockGetCurrentUser).toHaveBeenCalled();
      expect(res).toEqual({ threads });
    });
  });
});
