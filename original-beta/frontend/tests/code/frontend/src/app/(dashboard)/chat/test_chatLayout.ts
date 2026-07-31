import React from 'react';

jest.mock('server-only', () => ({}), { virtual: true });

jest.mock('@/app/(dashboard)/chat/_actions/getChatThreads', () => ({
  getChatThreads: jest.fn(),
}));

jest.mock('@/app/(dashboard)/chat/_components/chat-history', () => ({
  __esModule: true,
  default: (props: any) => React.createElement('div', { 'data-testid': 'chat-history', ...props }),
}));

import Layout from '@/app/(dashboard)/chat/layout';
import { getChatThreads } from '@/app/(dashboard)/chat/_actions/getChatThreads';

describe('chat Layout', () => {
  beforeEach(() => {
    (getChatThreads as jest.Mock).mockReset();
  });

  test('N-01-001: title が未設定のスレッドは (新しいチャット) に正規化されて ChatHistory に渡る', async () => {
    (getChatThreads as jest.Mock).mockResolvedValue({
      threads: [
        { id: 't1', title: undefined },
        { id: 't2', title: 'Hello' },
      ],
    });

    const element = await Layout({ children: React.createElement('div') });

    expect(React.isValidElement(element)).toBe(true);
    const rootChildren = (element as any).props.children as any[];
    const chatHistoryEl = rootChildren[0];

    expect(chatHistoryEl.props.threads).toEqual([
      { id: 't1', title: '(新しいチャット)' },
      { id: 't2', title: 'Hello' },
    ]);
  });

  test('I-01-001: 正規化と threadId 注入が同時に成立する', async () => {
    (getChatThreads as jest.Mock).mockResolvedValue({
      threads: [{ id: 't-first', title: undefined }],
    });

    function Child(props: { threadId?: string }) {
      return React.createElement('div', props);
    }
    const element = await Layout({ children: React.createElement(Child, {}) });

    const rootChildren = (element as any).props.children as any[];
    const chatHistoryEl = rootChildren[0];
    const clonedChildEl = rootChildren[1][0];

    expect(chatHistoryEl.props.threads).toEqual([{ id: 't-first', title: '(新しいチャット)' }]);
    expect(clonedChildEl.props.threadId).toBe('t-first');
  });

  test('N-01-002: 子要素が ReactElement の場合は threadId が注入される（先頭スレッドの id）', async () => {
    (getChatThreads as jest.Mock).mockResolvedValue({
      threads: [{ id: 't-first', title: 'X' }],
    });

    function Child(props: { threadId?: string }) {
      return React.createElement('div', props);
    }
    const childEl = React.createElement(Child, { threadId: 'original' });

    const element = await Layout({ children: childEl });
    const rootChildren = (element as any).props.children as any[];
    const clonedChildEl = rootChildren[1][0];

    expect(clonedChildEl.props.threadId).toBe('t-first');
  });

  test('L-01-001: threads が空の場合 threadId は undefined になる', async () => {
    (getChatThreads as jest.Mock).mockResolvedValue({ threads: [] });

    function Child(props: { threadId?: string }) {
      return React.createElement('div', props);
    }
    const element = await Layout({ children: React.createElement(Child, {}) });
    const rootChildren = (element as any).props.children as any[];
    const clonedChildEl = rootChildren[1][0];

    expect(clonedChildEl.props.threadId).toBeUndefined();
  });

  test('L-01-002: 子要素が非Elementの場合は clone されずそのまま返る', async () => {
    (getChatThreads as jest.Mock).mockResolvedValue({ threads: [{ id: 't1', title: 'X' }] });

    const element = await Layout({ children: 'plain-text-child' as any });
    const rootChildren = (element as any).props.children as any[];

    expect(rootChildren[1][0]).toBe('plain-text-child');
  });

  test('E-01-001: getChatThreads が例外を投げた場合は Layout も例外で失敗する', async () => {
    (getChatThreads as jest.Mock).mockRejectedValue(new Error('boom'));

    await expect(Layout({ children: React.createElement('div') })).rejects.toThrow('boom');
  });

  test('E-01-002: getChatThreads が不正な戻り値（threads undefined）を返すと例外になる', async () => {
    (getChatThreads as jest.Mock).mockResolvedValue({ threads: undefined });

    await expect(Layout({ children: React.createElement('div') })).rejects.toThrow();
  });
});
