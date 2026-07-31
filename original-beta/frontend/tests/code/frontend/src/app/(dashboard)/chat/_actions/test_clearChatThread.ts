import clearChatThread from '@/app/(dashboard)/chat/_actions/clearChatThread';

jest.mock('server-only', () => ({}), { virtual: true });

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('@/app/_utils/auth', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('@/app/_utils/message', () => ({
  getMessage: jest.fn((code: string) => `msg:${code}`),
}));

jest.mock('~/cosmos', () => ({
  threadContainer: {
    item: jest.fn(),
    items: {
      upsert: jest.fn(),
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
import { getMessage } from '@/app/_utils/message';
import { threadContainer, messageContainer } from '~/cosmos';

describe('clearChatThread', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-05T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('N-01-001: スレッドとメッセージを論理削除して成功する', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const read = jest.fn().mockResolvedValue({
      resource: { id: 't1', userId: 'user-1', createdAt: new Date(), updatedAt: new Date() },
    });
    (threadContainer.item as jest.Mock).mockReturnValue({ read });

    (messageContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockResolvedValue({
        resources: [
          { id: 'm1', threadId: 't1', createdAt: new Date(), role: 'user', content: 'a' },
          { id: 'm2', threadId: 't1', createdAt: new Date(), role: 'assistant', content: 'b' },
        ],
      }),
    });

    const result = await clearChatThread('t1');

    expect(result).toEqual({ success: true });
    expect(threadContainer.item).toHaveBeenCalledWith('t1', 'user-1');
    expect(threadContainer.items.upsert).toHaveBeenCalledTimes(1);
    expect(messageContainer.items.upsert).toHaveBeenCalledTimes(2);
    expect(revalidatePath).toHaveBeenCalledWith('/chat');
  });

  test('N-01-002: メッセージが0件でもスレッドのみ論理削除して成功する', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const read = jest.fn().mockResolvedValue({
      resource: { id: 't1', userId: 'user-1', createdAt: new Date(), updatedAt: new Date() },
    });
    (threadContainer.item as jest.Mock).mockReturnValue({ read });

    (messageContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockResolvedValue({ resources: [] }),
    });

    const result = await clearChatThread('t1');

    expect(result).toEqual({ success: true });
    expect(threadContainer.items.upsert).toHaveBeenCalledTimes(1);
    expect(messageContainer.items.upsert).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/chat');
  });

  test('I-01-001: messageContainer のクエリが threadId パラメータ付きで実行される', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const read = jest.fn().mockResolvedValue({
      resource: { id: 't1', userId: 'user-1', createdAt: new Date(), updatedAt: new Date() },
    });
    (threadContainer.item as jest.Mock).mockReturnValue({ read });

    (messageContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockResolvedValue({ resources: [] }),
    });

    await clearChatThread('t1');

    expect(messageContainer.items.query).toHaveBeenCalledWith({
      query: 'SELECT * FROM c WHERE c.threadId = @threadId',
      parameters: [{ name: '@threadId', value: 't1' }],
    });
  });

  test('L-01-001: deletedAt は現在時刻の Date として保存される', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const read = jest.fn().mockResolvedValue({
      resource: { id: 't1', userId: 'user-1', createdAt: new Date(), updatedAt: new Date() },
    });
    (threadContainer.item as jest.Mock).mockReturnValue({ read });

    (messageContainer.items.query as jest.Mock).mockReturnValue({
      fetchAll: jest.fn().mockResolvedValue({ resources: [] }),
    });

    await clearChatThread('t1');

    expect(threadContainer.items.upsert).toHaveBeenCalledTimes(1);
    const upsertArg = (threadContainer.items.upsert as jest.Mock).mock.calls[0][0];
    expect(upsertArg.deletedAt).toEqual(new Date('2026-03-05T00:00:00.000Z'));
  });

  test('L-01-002: id が空文字の場合でもエラー応答し revalidatePath される', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const read = jest.fn().mockResolvedValue({ resource: undefined });
    (threadContainer.item as jest.Mock).mockReturnValue({ read });

    const result = await clearChatThread('');

    expect(result).toEqual({ success: false, message: 'msg:E_F_00010' });
    expect(threadContainer.item).toHaveBeenCalledWith('', 'user-1');
    expect(revalidatePath).toHaveBeenCalledWith('/chat');
  });

  test('E-01-001: スレッドが存在しない場合はエラーを返す', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const read = jest.fn().mockResolvedValue({ resource: undefined });
    (threadContainer.item as jest.Mock).mockReturnValue({ read });

    const result = await clearChatThread('t-missing');

    expect(result).toEqual({ success: false, message: 'msg:E_F_00010' });
    expect(getMessage).toHaveBeenCalledWith('E_F_00010', 'チャット', 'チャット');
    expect(threadContainer.items.upsert).not.toHaveBeenCalled();
    expect(messageContainer.items.upsert).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/chat');
  });

  test('E-01-002: 既に削除済みのスレッドはエラーを返す', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const read = jest.fn().mockResolvedValue({
      resource: { id: 't1', userId: 'user-1', deletedAt: new Date() },
    });
    (threadContainer.item as jest.Mock).mockReturnValue({ read });

    const result = await clearChatThread('t1');

    expect(result).toEqual({ success: false, message: 'msg:E_F_00020' });
    expect(getMessage).toHaveBeenCalledWith('E_F_00020', 'チャット', 'チャット');
    expect(threadContainer.items.upsert).not.toHaveBeenCalled();
    expect(messageContainer.items.upsert).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/chat');
  });

  test('E-01-003: 例外発生時は success=false を返し revalidatePath は実行される', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const read = jest.fn().mockRejectedValue(new Error('boom'));
    (threadContainer.item as jest.Mock).mockReturnValue({ read });

    const result = await clearChatThread('t1');

    expect(result).toEqual({ success: false });
    expect(revalidatePath).toHaveBeenCalledWith('/chat');
  });
});
