import { getMessage } from '@/app/(dashboard)/chat/[id]/_actions/getChatMessage';

jest.mock('@/app/_utils/auth', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('~/cosmos', () => ({
  messageContainer: {
    item: jest.fn(),
  },
}));

import { getCurrentUser } from '@/app/_utils/auth';
import { messageContainer } from '~/cosmos';

describe('getMessage', () => {
  test('N-01-001: message が存在する場合は feedbackAt を返す', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const read = jest.fn().mockResolvedValue({
      resource: {
        id: 'msg-1',
        feedbackAt: new Date('2026-03-05T00:00:00.000Z'),
      },
    });
    (messageContainer.item as jest.Mock).mockReturnValue({ read });

    const result = await getMessage('msg-1');

    expect(messageContainer.item).toHaveBeenCalledWith('msg-1', 'user-1');
    expect(result).toEqual({ feedbackAt: new Date('2026-03-05T00:00:00.000Z') });
  });

  test('I-01-001: getCurrentUser の userId が item(id, userId) に連携される', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-from-auth' });

    const read = jest.fn().mockResolvedValue({
      resource: {
        id: 'msg-1',
        feedbackAt: undefined,
      },
    });
    (messageContainer.item as jest.Mock).mockReturnValue({ read });

    await getMessage('msg-1');

    expect(getCurrentUser).toHaveBeenCalledTimes(1);
    expect(messageContainer.item).toHaveBeenCalledWith('msg-1', 'user-from-auth');
    expect(read).toHaveBeenCalledTimes(1);
  });

  test('L-01-001: feedbackAt が未設定でも { feedbackAt: undefined } を返す', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const read = jest.fn().mockResolvedValue({
      resource: {
        id: 'msg-1',
      },
    });
    (messageContainer.item as jest.Mock).mockReturnValue({ read });

    const result = await getMessage('msg-1');

    expect(result).toEqual({ feedbackAt: undefined });
  });

  test('N-01-002: message が存在しない場合は null を返す', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const read = jest.fn().mockResolvedValue({ resource: undefined });
    (messageContainer.item as jest.Mock).mockReturnValue({ read });

    const result = await getMessage('msg-404');

    expect(result).toBeNull();
  });

  test('E-01-001: user.id が無い場合は Unauthorized を投げる', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: '' });

    await expect(getMessage('msg-1')).rejects.toThrow('Unauthorized: User ID not found');
  });

  test('E-01-002: read が例外を投げた場合は Failed to fetch message を投げる', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ id: 'user-1' });

    const read = jest.fn().mockRejectedValue(new Error('boom'));
    (messageContainer.item as jest.Mock).mockReturnValue({ read });

    await expect(getMessage('msg-1')).rejects.toThrow('Failed to fetch message');
  });
});
