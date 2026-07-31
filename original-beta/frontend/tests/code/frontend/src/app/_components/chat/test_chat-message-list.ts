/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('@/app/_components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: any) =>
    React.createElement('div', { 'data-testid': 'scroll-area' }, children),
}));

jest.mock('@/app/_components/chat/chat-message', () => ({
  __esModule: true,
  default: ({ message, className }: any) =>
    React.createElement(
      'div',
      { 'data-testid': `msg-${message.role}`, className },
      message.content
    ),
}));

jest.mock('@/app/_components/chat/assistant-message-skeleton', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'assistant-skeleton' }),
}));

jest.mock('@/app/_utils/date', () => ({
  formatDate: (d: any, fmt: string) => {
    if (!d || typeof d === 'string') return '';
    if (fmt.includes('YYYY/MM/DD')) return `D${d.getDate()}`;
    return `T${d.getHours()}`;
  },
}));

import ChatMessageList from '@/app/_components/chat/chat-message-list';

describe('ChatMessageList', () => {
  beforeEach(() => {
    (Element.prototype as any).scrollIntoView = jest.fn();
  });

  test('N-01-001: 日付が変わるタイミングで日付ラベルを表示する', () => {
    const messages: any = [
      { id: '1', role: 'user', content: 'u1', createdAt: new Date('2024-01-01T00:00:00Z') },
      { id: '2', role: 'assistant', content: 'a1', createdAt: new Date('2024-01-01T01:00:00Z') },
      { id: '3', role: 'assistant', content: 'a2', createdAt: new Date('2024-01-02T01:00:00Z') },
    ];

    render(React.createElement(ChatMessageList, { messages, isLoading: false }));
    // D1 と D2 がそれぞれ1回出る
    expect(screen.getByText('D1')).toBeInTheDocument();
    expect(screen.getByText('D2')).toBeInTheDocument();
  });

  test('N-01-002: isLoading=true でスケルトンを表示する', () => {
    render(React.createElement(ChatMessageList, { messages: [], isLoading: true }));
    expect(screen.getByTestId('assistant-skeleton')).toBeInTheDocument();
  });

  test('I-01-001: 最後の assistant メッセージ位置に recommend ボタンを表示し、クリックで通知する', () => {
    const onRecommendClick = jest.fn();
    const messages: any = [
      { id: '1', role: 'assistant', content: 'a1' },
      { id: '2', role: 'user', content: 'u1' },
      { id: '3', role: 'assistant', content: 'a2' },
    ];

    render(
      React.createElement(ChatMessageList, {
        messages,
        isLoading: false,
        recommend: ['r1', 'r2'],
        onRecommendClick,
      })
    );

    fireEvent.click(screen.getByRole('button', { name: 'r1' }));
    expect(onRecommendClick).toHaveBeenCalledWith('r1');
  });

  test('L-01-001: messages が空の場合は何も表示しない', () => {
    render(React.createElement(ChatMessageList, { messages: [], isLoading: false }));
    const scrollArea = screen.getByTestId('scroll-area');
    expect(scrollArea.querySelector('[data-testid^="msg-"]')).not.toBeInTheDocument();
  });

  test('L-01-002: messages が1件のみの場合でも正常に表示される', () => {
    const messages: any = [{ id: '1', role: 'user', content: 'Hello' }];
    render(React.createElement(ChatMessageList, { messages, isLoading: false }));
    expect(screen.getByTestId('msg-user')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  test('L-01-003: 全てのメッセージが同じ日付の場合、日付ラベルは1つだけ表示される', () => {
    const messages: any = [
      { id: '1', role: 'user', content: 'u1', createdAt: new Date('2024-01-01T00:00:00Z') },
      { id: '2', role: 'assistant', content: 'a1', createdAt: new Date('2024-01-01T01:00:00Z') },
      { id: '3', role: 'user', content: 'u2', createdAt: new Date('2024-01-01T02:00:00Z') },
    ];

    render(React.createElement(ChatMessageList, { messages, isLoading: false }));
    const dateLabels = screen.getAllByText('D1');
    expect(dateLabels).toHaveLength(1);
  });

  test('L-01-004: isLoading=false の場合はスケルトンを表示しない', () => {
    render(React.createElement(ChatMessageList, { messages: [], isLoading: false }));
    expect(screen.queryByTestId('assistant-skeleton')).not.toBeInTheDocument();
  });

  test('L-01-005: onRecommendClick が未定義の場合、recommendボタンをクリックしてもエラーにならない', () => {
    const messages: any = [{ id: '1', role: 'assistant', content: 'a1' }];

    render(
      React.createElement(ChatMessageList, {
        messages,
        isLoading: false,
        recommend: ['r1'],
      })
    );

    const button = screen.getByRole('button', { name: 'r1' });
    expect(() => fireEvent.click(button)).not.toThrow();
  });

  test('L-01-006: 最後のメッセージがuserロールでも、assistantメッセージがあればrecommendボタンは表示される', () => {
    const messages: any = [
      { id: '1', role: 'assistant', content: 'a1' },
      { id: '2', role: 'user', content: 'u1' },
    ];

    render(
      React.createElement(ChatMessageList, {
        messages,
        isLoading: false,
        recommend: ['r1'],
      })
    );

    // 最後のassistantメッセージの後にrecommendボタンが表示される
    expect(screen.getByRole('button', { name: 'r1' })).toBeInTheDocument();
  });

  test('L-01-007: recommend が空配列の場合、ボタンは表示されない', () => {
    const messages: any = [{ id: '1', role: 'assistant', content: 'a1' }];

    render(
      React.createElement(ChatMessageList, {
        messages,
        isLoading: false,
        recommend: [],
      })
    );

    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  test('N-01-003: 複数のrecommendボタンが順番に表示される', () => {
    const messages: any = [{ id: '1', role: 'assistant', content: 'a1' }];
    const recommend = ['推奨1', '推奨2', '推奨3'];

    render(
      React.createElement(ChatMessageList, {
        messages,
        isLoading: false,
        recommend,
      })
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toHaveTextContent('推奨1');
    expect(buttons[1]).toHaveTextContent('推奨2');
    expect(buttons[2]).toHaveTextContent('推奨3');
  });

  test('L-01-008: createdAt が undefined のメッセージでも日付ラベルなしで表示される', () => {
    const messages: any = [
      { id: '1', role: 'user', content: 'u1', createdAt: undefined },
      { id: '2', role: 'assistant', content: 'a1', createdAt: undefined },
    ];

    render(React.createElement(ChatMessageList, { messages, isLoading: false }));

    expect(screen.getByTestId('msg-user')).toBeInTheDocument();
    expect(screen.getByTestId('msg-assistant')).toBeInTheDocument();
    expect(screen.queryByText(/D\d/)).not.toBeInTheDocument();
  });
});
