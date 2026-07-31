import { getChatThread } from '@/app/(dashboard)/chat/[id]/_actions/getChatThread';

const notFoundMock = jest.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});

jest.mock('server-only', () => ({}), { virtual: true });

jest.mock('next/navigation', () => ({
  notFound: () => notFoundMock(),
}));

jest.mock('@/app/_utils/auth', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('~/cosmos', () => ({
  threadContainer: {
    item: jest.fn(),
  },
  messageContainer: {
    items: {
      query: jest.fn(),
    },
  },
}));

import { getCurrentUser } from '@/app/_utils/auth';
import { messageContainer, threadContainer } from '~/cosmos';

describe('getChatThread', () => {
  test('N-01-001: thread と messages を取得して返す', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const threadRead = jest.fn().mockResolvedValue({
      resource: {
        id: 't1',
        userId: 'user-1',
      },
    });
    (threadContainer.item as jest.Mock).mockReturnValue({ read: threadRead });

    const fetchAll = jest.fn().mockResolvedValue({ resources: [{ id: 'm1' }, { id: 'm2' }] });
    (messageContainer.items.query as jest.Mock).mockReturnValue({ fetchAll });

    const result = await getChatThread('t1');

    expect(result).toEqual({ id: 't1', messages: [{ id: 'm1' }, { id: 'm2' }] });
    expect(threadContainer.item).toHaveBeenCalledWith('t1', 'user-1');

    expect(messageContainer.items.query).toHaveBeenCalledWith({
      query: 'SELECT * FROM c WHERE c.threadId = @threadId AND c.userId = @userId',
      parameters: [
        { name: '@threadId', value: 't1' },
        { name: '@userId', value: 'user-1' },
      ],
    });
    expect(fetchAll).toHaveBeenCalledTimes(1);
  });

  test('L-01-001: userId が空文字でもクエリパラメータに反映される', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: '' });

    const threadRead = jest.fn().mockResolvedValue({
      resource: {
        id: 't1',
        userId: '',
      },
    });
    (threadContainer.item as jest.Mock).mockReturnValue({ read: threadRead });

    const fetchAll = jest.fn().mockResolvedValue({ resources: [] });
    (messageContainer.items.query as jest.Mock).mockReturnValue({ fetchAll });

    const result = await getChatThread('t1');

    expect(result).toEqual({ id: 't1', messages: [] });
    expect(threadContainer.item).toHaveBeenCalledWith('t1', '');
    expect(messageContainer.items.query).toHaveBeenCalledWith({
      query: 'SELECT * FROM c WHERE c.threadId = @threadId AND c.userId = @userId',
      parameters: [
        { name: '@threadId', value: 't1' },
        { name: '@userId', value: '' },
      ],
    });
  });

  test('I-01-001: thread 取得後に messages 取得が行われる', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const threadRead = jest.fn().mockResolvedValue({
      resource: {
        id: 't1',
        userId: 'user-1',
      },
    });
    (threadContainer.item as jest.Mock).mockReturnValue({ read: threadRead });

    (messageContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockResolvedValue({ resources: [] }),
    });

    await getChatThread('t1');

    const itemOrder = (threadContainer.item as jest.Mock).mock.invocationCallOrder[0];
    const readOrder = (threadRead as jest.Mock).mock.invocationCallOrder[0];
    const queryOrder = (messageContainer.items.query as jest.Mock).mock.invocationCallOrder[0];

    expect(itemOrder).toBeLessThan(queryOrder);
    expect(readOrder).toBeLessThan(queryOrder);
  });

  test('E-01-001: thread が存在しない場合は notFound() される', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const threadRead = jest.fn().mockResolvedValue({ resource: undefined });
    (threadContainer.item as jest.Mock).mockReturnValue({ read: threadRead });

    await expect(getChatThread('t404')).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalledTimes(1);
    expect(messageContainer.items.query).not.toHaveBeenCalled();
  });

  test('E-01-002: thread.deletedAt がある場合は notFound() される', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const threadRead = jest.fn().mockResolvedValue({
      resource: {
        id: 't1',
        userId: 'user-1',
        deletedAt: new Date('2026-03-01T00:00:00.000Z'),
      },
    });
    (threadContainer.item as jest.Mock).mockReturnValue({ read: threadRead });

    await expect(getChatThread('t1')).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalledTimes(1);
    expect(messageContainer.items.query).not.toHaveBeenCalled();
  });

  test('E-01-003: message query/fetchAll が例外を投げた場合は伝播する', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const threadRead = jest.fn().mockResolvedValue({
      resource: {
        id: 't1',
        userId: 'user-1',
      },
    });
    (threadContainer.item as jest.Mock).mockReturnValue({ read: threadRead });

    (messageContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockRejectedValue(new Error('boom')),
    });

    await expect(getChatThread('t1')).rejects.toThrow('boom');
  });
});
