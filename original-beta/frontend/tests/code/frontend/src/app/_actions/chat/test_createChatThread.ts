import { createChatThread } from '@/app/_actions/chat/createChatThread';
import { ChatType } from '@/app/_types/chat-type';
import { getCurrentUser } from '@/app/_utils/auth';
import { uniqueId } from '@/app/_utils/uniqueId';
import { threadContainer, ragThreadContainer, agentThreadContainer } from '~/cosmos';

jest.mock('@/app/_utils/auth');
jest.mock('@/app/_utils/uniqueId');
jest.mock('~/cosmos', () => ({
  threadContainer: {
    items: {
      create: jest.fn(),
    },
  },
  ragThreadContainer: {
    items: {
      create: jest.fn(),
    },
  },
  agentThreadContainer: {
    items: {
      create: jest.fn(),
    },
  },
}));

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;
const mockUniqueId = uniqueId as jest.MockedFunction<typeof uniqueId>;

describe('createChatThread', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUniqueId.mockReturnValue('thread-new');
    mockGetCurrentUser.mockResolvedValue({
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      departmentName: 'Test Department',
    });

    (threadContainer.items.create as jest.Mock).mockResolvedValue({
      resource: { id: 'thread-new' },
    });
    (ragThreadContainer.items.create as jest.Mock).mockResolvedValue({
      resource: { id: 'thread-new' },
    });
    (agentThreadContainer.items.create as jest.Mock).mockResolvedValue({
      resource: { id: 'thread-new' },
    });
  });

  describe('正常系テスト', () => {
    test('N-01-001: Chatタイプでスレッド作成が成功すること', async () => {
      const res = await createChatThread(ChatType.Chat);
      expect(res.success).toBe(true);
      expect(res.id).toBe('thread-new');
      expect(threadContainer.items.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'thread-new',
          userId: 'user-123',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })
      );
    });

    test('N-01-002: RagChatタイプでスレッド作成が成功すること', async () => {
      const res = await createChatThread(ChatType.RagChat);
      expect(res.success).toBe(true);
      expect(res.id).toBe('thread-new');
      expect(ragThreadContainer.items.create).toHaveBeenCalled();
    });

    test('N-01-003: Agentタイプでスレッド作成が成功すること', async () => {
      const res = await createChatThread(ChatType.Agent);
      expect(res.success).toBe(true);
      expect(res.id).toBe('thread-new');
      expect(agentThreadContainer.items.create).toHaveBeenCalled();
    });
  });

  describe('異常系テスト', () => {
    test('E-01-001: 無効なチャットタイプの場合は失敗すること', async () => {
      const res = await createChatThread('invalid-type' as ChatType);
      expect(res.success).toBe(false);
      expect(res.message).toBe('無効なパラメータです');
    });

    test('E-02-001: DBからresourceが返らない場合は失敗すること', async () => {
      (threadContainer.items.create as jest.Mock).mockResolvedValue({ resource: null });
      const res = await createChatThread(ChatType.Chat);
      expect(res.success).toBe(false);
      expect(res.message).toBe('このチャットは存在しません');
    });

    test('E-03-001: DB例外の場合は失敗すること', async () => {
      (threadContainer.items.create as jest.Mock).mockRejectedValue(new Error('db error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const res = await createChatThread(ChatType.Chat);

      expect(res.success).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('境界系テスト', () => {
    test('L-01-001: uniqueIdが空文字でもcreateが呼ばれること（実装依存の確認）', async () => {
      mockUniqueId.mockReturnValue('');
      (threadContainer.items.create as jest.Mock).mockResolvedValue({ resource: { id: '' } });

      const res = await createChatThread(ChatType.Chat);
      expect(res.success).toBe(true);
      expect(threadContainer.items.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '',
          userId: 'user-123',
        })
      );
    });

    test('L-02-001: uniqueIdが非常に長い文字列でもcreateが呼ばれること', async () => {
      const longId = 'x'.repeat(512);
      mockUniqueId.mockReturnValue(longId);
      (threadContainer.items.create as jest.Mock).mockResolvedValue({ resource: { id: longId } });

      const res = await createChatThread(ChatType.Chat);

      expect(res.success).toBe(true);
      expect(threadContainer.items.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: longId,
          userId: 'user-123',
        })
      );
    });
  });

  describe('モジュール疎通系テスト', () => {
    test('I-01-001: uniqueId→getCurrentUser→createが呼ばれること', async () => {
      await createChatThread(ChatType.Chat);

      expect(mockUniqueId).toHaveBeenCalled();
      expect(mockGetCurrentUser).toHaveBeenCalled();
      expect(threadContainer.items.create).toHaveBeenCalled();
    });
  });
});
