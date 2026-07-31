import { createChatThread } from '@/app/(dashboard)/chat/_actions/createChatThread';

jest.mock('server-only', () => ({}), { virtual: true });

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('@/app/_utils/auth', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('@/app/_utils/uniqueId', () => ({
  uniqueId: jest.fn(),
}));

jest.mock('~/cosmos', () => ({
  threadContainer: {
    items: {
      create: jest.fn(),
    },
  },
}));

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/app/_utils/auth';
import { uniqueId } from '@/app/_utils/uniqueId';
import { threadContainer } from '~/cosmos';

describe('createChatThread', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-05T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('N-01-001: スレッドを作成してIDを返す', async () => {
    (uniqueId as jest.Mock).mockReturnValue('t1');
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });
    (threadContainer.items.create as jest.Mock).mockResolvedValue({ resource: { id: 't1' } });

    const result = await createChatThread();

    expect(result).toEqual({ success: true, id: 't1' });
    expect(threadContainer.items.create).toHaveBeenCalledWith({
      id: 't1',
      userId: 'user-1',
      createdAt: new Date('2026-03-05T00:00:00.000Z'),
      updatedAt: new Date('2026-03-05T00:00:00.000Z'),
    });
    expect(revalidatePath).toHaveBeenCalledWith('/chat');
  });

  test('I-01-001: uniqueId の結果が create の id に使われる', async () => {
    (uniqueId as jest.Mock).mockReturnValue('tid-from-unique');
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });
    (threadContainer.items.create as jest.Mock).mockResolvedValue({
      resource: { id: 'tid-from-unique' },
    });

    const result = await createChatThread();

    expect(result).toEqual({ success: true, id: 'tid-from-unique' });
    expect(uniqueId).toHaveBeenCalledTimes(1);
    expect(threadContainer.items.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'tid-from-unique', userId: 'user-1' })
    );
  });

  test('L-01-001: uniqueId が空文字を返しても create が成功すれば成功する', async () => {
    (uniqueId as jest.Mock).mockReturnValue('');
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });
    (threadContainer.items.create as jest.Mock).mockResolvedValue({ resource: { id: '' } });

    const result = await createChatThread();

    expect(result).toEqual({ success: true, id: '' });
    expect(revalidatePath).toHaveBeenCalledWith('/chat');
  });

  test('E-01-001: resource が返らない場合は success=false', async () => {
    (uniqueId as jest.Mock).mockReturnValue('t1');
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });
    (threadContainer.items.create as jest.Mock).mockResolvedValue({ resource: undefined });

    const result = await createChatThread();

    expect(result).toEqual({ success: false });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test('E-01-002: 例外発生時は success=false', async () => {
    (uniqueId as jest.Mock).mockReturnValue('t1');
    (getCurrentUser as jest.Mock).mockRejectedValue(new Error('boom'));

    const result = await createChatThread();

    expect(result).toEqual({ success: false });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test('E-01-003: Cosmos の create が例外を投げた場合は success=false', async () => {
    (uniqueId as jest.Mock).mockReturnValue('t1');
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });
    (threadContainer.items.create as jest.Mock).mockRejectedValue(new Error('boom'));

    const result = await createChatThread();

    expect(result).toEqual({ success: false });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
