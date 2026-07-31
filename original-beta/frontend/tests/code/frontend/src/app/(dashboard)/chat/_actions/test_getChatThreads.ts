import { getChatThreads } from '@/app/(dashboard)/chat/_actions/getChatThreads';

jest.mock('server-only', () => ({}), { virtual: true });

jest.mock('@/app/_utils/auth', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('~/cosmos', () => ({
  threadContainer: {
    items: {
      query: jest.fn(),
    },
  },
}));

import { getCurrentUser } from '@/app/_utils/auth';
import { threadContainer } from '~/cosmos';

describe('getChatThreads', () => {
  test('N-01-001: userId でスレッドを取得して返す', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    (threadContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockResolvedValue({ resources: [{ id: 't1' }, { id: 't2' }] }),
    });

    const result = await getChatThreads();

    expect(result).toEqual({ threads: [{ id: 't1' }, { id: 't2' }] });
    expect(threadContainer.items.query).toHaveBeenCalledWith({
      query:
        'SELECT * FROM c WHERE c.userId = @userId AND NOT IS_DEFINED(c.deletedAt) ORDER BY c.updatedAt DESC',
      parameters: [{ name: '@userId', value: 'user-1' }],
    });
  });

  test('I-01-001: query→fetchAll の結果がそのまま threads として返る', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const fetchAll = jest.fn().mockResolvedValue({ resources: [{ id: 't1' }] });
    (threadContainer.items.query as jest.Mock).mockReturnValue({ fetchAll });

    const result = await getChatThreads();

    expect(fetchAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ threads: [{ id: 't1' }] });
  });

  test('L-01-001: userId が空文字でもクエリパラメータに反映される', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: '' });

    (threadContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockResolvedValue({ resources: [] }),
    });

    await getChatThreads();

    expect(threadContainer.items.query).toHaveBeenCalledWith({
      query:
        'SELECT * FROM c WHERE c.userId = @userId AND NOT IS_DEFINED(c.deletedAt) ORDER BY c.updatedAt DESC',
      parameters: [{ name: '@userId', value: '' }],
    });
  });

  test('E-01-001: 例外は呼び出し元へ伝播する', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    (threadContainer.items.query as jest.Mock).mockImplementation(() => {
      throw new Error('boom');
    });

    await expect(getChatThreads()).rejects.toThrow('boom');
  });
});
