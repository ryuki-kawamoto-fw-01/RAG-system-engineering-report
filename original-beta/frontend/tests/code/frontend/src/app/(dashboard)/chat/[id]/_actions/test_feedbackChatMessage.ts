import feedbackChatMessage from '@/app/(dashboard)/chat/[id]/_actions/feedbackChatMessage';

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('@/app/_utils/auth', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('~/cosmos', () => ({
  messageContainer: {
    item: jest.fn(),
    items: {
      upsert: jest.fn(),
    },
  },
}));

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/app/_utils/auth';
import { messageContainer } from '~/cosmos';

describe('feedbackChatMessage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-05T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('N-01-001: フィードバックを保存して success=true を返す', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const read = jest.fn().mockResolvedValue({
      resource: {
        id: 'msg-1',
        threadId: 't1',
        role: 'assistant',
        content: 'hello',
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        userId: 'user-1',
        userEmail: 'u@example.com',
        userName: 'U',
      },
    });

    (messageContainer.item as jest.Mock).mockReturnValue({ read });
    (messageContainer.items.upsert as jest.Mock).mockResolvedValue({});

    const result = await feedbackChatMessage(
      'msg-1',
      0,
      ['1', '2', '3', '4', '5', '6'],
      'free text'
    );

    expect(result).toEqual({ success: true });
    expect(messageContainer.item).toHaveBeenCalledWith('msg-1', 'user-1');

    expect(messageContainer.items.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'msg-1',
        feedbackType: 0,
        feedbackOption1: 1,
        feedbackOption2: 1,
        feedbackOption3: 1,
        feedbackOption4: 1,
        feedbackOption5: 1,
        feedbackOption6: 1,
        feedbackText: 'free text',
        feedbackAt: new Date('2026-03-05T00:00:00.000Z'),
      })
    );

    expect(revalidatePath).toHaveBeenCalledWith('/chat');
  });

  test('L-01-001: feedbackOptions が空なら option1-6 は全て 0 になる', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const read = jest.fn().mockResolvedValue({
      resource: {
        id: 'msg-1',
        threadId: 't1',
        role: 'assistant',
        content: 'hello',
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        userId: 'user-1',
        userEmail: 'u@example.com',
        userName: 'U',
      },
    });

    (messageContainer.item as jest.Mock).mockReturnValue({ read });
    (messageContainer.items.upsert as jest.Mock).mockResolvedValue({});

    await feedbackChatMessage('msg-1', 1, [], '');

    expect(messageContainer.items.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        feedbackType: 1,
        feedbackOption1: 0,
        feedbackOption2: 0,
        feedbackOption3: 0,
        feedbackOption4: 0,
        feedbackOption5: 0,
        feedbackOption6: 0,
        feedbackText: '',
      })
    );
  });

  test('L-01-002: 未定義の option 値は無視され option1-6 は全て 0 になる', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const read = jest.fn().mockResolvedValue({
      resource: {
        id: 'msg-1',
        threadId: 't1',
        role: 'assistant',
        content: 'hello',
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        userId: 'user-1',
        userEmail: 'u@example.com',
        userName: 'U',
      },
    });

    (messageContainer.item as jest.Mock).mockReturnValue({ read });
    (messageContainer.items.upsert as jest.Mock).mockResolvedValue({});

    await feedbackChatMessage('msg-1', 0, ['0', '7', 'x'], '');

    expect(messageContainer.items.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        feedbackOption1: 0,
        feedbackOption2: 0,
        feedbackOption3: 0,
        feedbackOption4: 0,
        feedbackOption5: 0,
        feedbackOption6: 0,
      })
    );
  });

  test('I-01-001: read → upsert → revalidatePath の順に処理される', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const read = jest.fn().mockResolvedValue({
      resource: {
        id: 'msg-1',
        threadId: 't1',
        role: 'assistant',
        content: 'hello',
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        userId: 'user-1',
        userEmail: 'u@example.com',
        userName: 'U',
      },
    });
    (messageContainer.item as jest.Mock).mockReturnValue({ read });
    (messageContainer.items.upsert as jest.Mock).mockResolvedValue({});

    await feedbackChatMessage('msg-1', 0, ['1'], 'x');

    const readOrder = (read as jest.Mock).mock.invocationCallOrder[0];
    const upsertOrder = (messageContainer.items.upsert as jest.Mock).mock.invocationCallOrder[0];
    const revalidateOrder = (revalidatePath as jest.Mock).mock.invocationCallOrder[0];
    expect(readOrder).toBeLessThan(upsertOrder);
    expect(upsertOrder).toBeLessThan(revalidateOrder);
  });

  test('E-01-001: message が見つからない場合は success=false', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const read = jest.fn().mockResolvedValue({ resource: undefined });
    (messageContainer.item as jest.Mock).mockReturnValue({ read });

    const result = await feedbackChatMessage('msg-404', 0, ['1'], 'x');

    expect(result).toEqual({ success: false });
    expect(messageContainer.items.upsert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test('E-01-002: 既に feedbackType がある場合は success=false', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const read = jest.fn().mockResolvedValue({
      resource: {
        id: 'msg-1',
        threadId: 't1',
        role: 'assistant',
        content: 'hello',
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        userId: 'user-1',
        userEmail: 'u@example.com',
        userName: 'U',
        feedbackType: 0,
      },
    });

    (messageContainer.item as jest.Mock).mockReturnValue({ read });

    const result = await feedbackChatMessage('msg-1', 1, ['2'], 'x');

    expect(result).toEqual({ success: false });
    expect(messageContainer.items.upsert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test('E-01-003: read が例外を投げた場合は success=false', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const read = jest.fn().mockRejectedValue(new Error('boom'));
    (messageContainer.item as jest.Mock).mockReturnValue({ read });

    const result = await feedbackChatMessage('msg-1', 0, [], 'x');

    expect(result).toEqual({ success: false });
    expect(messageContainer.items.upsert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  test('E-01-004: upsert が例外を投げた場合は success=false', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const read = jest.fn().mockResolvedValue({
      resource: {
        id: 'msg-1',
        threadId: 't1',
        role: 'assistant',
        content: 'hello',
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        userId: 'user-1',
        userEmail: 'u@example.com',
        userName: 'U',
      },
    });

    (messageContainer.item as jest.Mock).mockReturnValue({ read });
    (messageContainer.items.upsert as jest.Mock).mockRejectedValue(new Error('boom'));

    const result = await feedbackChatMessage('msg-1', 0, ['1'], 'x');

    expect(result).toEqual({ success: false });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
