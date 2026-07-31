import { clearChatThreads } from '@/app/(dashboard)/chat/_actions/clearChatThreads';

jest.mock('server-only', () => ({}), { virtual: true });

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('@/app/_utils/auth', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('~/cosmos', () => ({
  threadContainer: {
    items: {
      query: jest.fn(),
      bulk: jest.fn(),
    },
  },
  messageContainer: {
    items: {
      query: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/app/_utils/auth';
import { threadContainer, messageContainer } from '~/cosmos';

describe('clearChatThreads', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-05T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('N-01-001: 対象スレッドが0件でも成功し revalidatePath する', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    (threadContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockResolvedValue({ resources: [] }),
    });

    const result = await clearChatThreads();

    expect(result).toEqual({ success: true });
    expect(threadContainer.items.bulk).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/chat');
  });

  test('N-01-002: 50件を超える場合は bulk がバッチ分割される', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const threads = Array.from({ length: 55 }, (_, i) => ({
      id: `t${i + 1}`,
      userId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    (threadContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockResolvedValue({ resources: threads }),
    });

    // 先頭スレッドだけメッセージ1件を返して upsert ループを通す
    let queryCallCount = 0;
    (messageContainer.items.query as jest.Mock).mockImplementation(() => {
      const isFirst = queryCallCount++ === 0;
      return {
        fetchAll: jest.fn().mockResolvedValue({
          resources: isFirst ? [{ id: 'm1', threadId: 't1' }] : [],
        }),
      };
    });

    const result = await clearChatThreads();

    expect(result).toEqual({ success: true });
    expect(threadContainer.items.bulk).toHaveBeenCalledTimes(2);

    const firstBatchOps = (threadContainer.items.bulk as jest.Mock).mock.calls[0][0];
    const secondBatchOps = (threadContainer.items.bulk as jest.Mock).mock.calls[1][0];
    expect(firstBatchOps).toHaveLength(50);
    expect(secondBatchOps).toHaveLength(5);

    expect(messageContainer.items.query).toHaveBeenCalledTimes(55);
    expect(messageContainer.items.upsert).toHaveBeenCalledTimes(1);
    expect(revalidatePath).toHaveBeenCalledWith('/chat');
  });

  test('L-01-002: ちょうど50件の場合は bulk が1回だけ呼ばれる', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const threads = Array.from({ length: 50 }, (_, i) => ({
      id: `t${i + 1}`,
      userId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    (threadContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockResolvedValue({ resources: threads }),
    });

    (messageContainer.items.query as jest.Mock).mockImplementation(() => ({
      fetchAll: jest.fn().mockResolvedValue({ resources: [] }),
    }));

    const result = await clearChatThreads();

    expect(result).toEqual({ success: true });
    expect(threadContainer.items.bulk).toHaveBeenCalledTimes(1);
    const ops = (threadContainer.items.bulk as jest.Mock).mock.calls[0][0];
    expect(ops).toHaveLength(50);
  });

  test('N-01-004: メッセージが複数件あるスレッドは upsert が件数分呼ばれる', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const threads = [{ id: 't1', userId: 'user-1', createdAt: new Date(), updatedAt: new Date() }];
    (threadContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockResolvedValue({ resources: threads }),
    });

    (messageContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockResolvedValue({
        resources: [
          { id: 'm1', threadId: 't1' },
          { id: 'm2', threadId: 't1' },
        ],
      }),
    });

    const result = await clearChatThreads();

    expect(result).toEqual({ success: true });
    expect(messageContainer.items.upsert).toHaveBeenCalledTimes(2);
  });

  test('I-01-001: bulk の operationType/id/resourceBody が期待形状になる', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const threads = [{ id: 't1', userId: 'user-1', createdAt: new Date(), updatedAt: new Date() }];
    (threadContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockResolvedValue({ resources: threads }),
    });
    (messageContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockResolvedValue({ resources: [] }),
    });

    await clearChatThreads();

    expect(threadContainer.items.bulk).toHaveBeenCalledTimes(1);
    const ops = (threadContainer.items.bulk as jest.Mock).mock.calls[0][0];
    expect(ops[0]).toEqual(
      expect.objectContaining({
        operationType: expect.any(String),
        id: 't1',
        resourceBody: expect.objectContaining({
          id: 't1',
          userId: 'user-1',
          deletedAt: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      })
    );
  });

  test('L-01-001: createdAt/updatedAt が未定義でも例外なく論理削除できる', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const threads = [{ id: 't1', userId: 'user-1' }];
    (threadContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockResolvedValue({ resources: threads }),
    });
    (messageContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockResolvedValue({ resources: [] }),
    });

    const result = await clearChatThreads();

    expect(result).toEqual({ success: true });
    expect(threadContainer.items.bulk).toHaveBeenCalledTimes(1);
  });

  test('E-01-001: 例外発生時は success=false を返し revalidatePath は呼ばれない', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    (threadContainer.items.query as jest.Mock).mockImplementation(() => {
      throw new Error('boom');
    });

    const result = await clearChatThreads();

    expect(result).toEqual({ success: false });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test('E-01-002: メッセージ upsert が失敗した場合は success=false を返す', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const threads = [{ id: 't1', userId: 'user-1', createdAt: new Date(), updatedAt: new Date() }];
    (threadContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockResolvedValue({ resources: threads }),
    });
    (messageContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockResolvedValue({ resources: [{ id: 'm1', threadId: 't1' }] }),
    });
    (threadContainer.items.bulk as jest.Mock).mockResolvedValue([]);
    (messageContainer.items.upsert as jest.Mock).mockRejectedValue(new Error('boom'));

    const result = await clearChatThreads();

    expect(result).toEqual({ success: false });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
