/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/app/_utils/message', () => ({
  getMessage: (code: string, subject: string) => `${code}:${subject}`,
}));

jest.mock('@/app/_components/icon/button/Add', () => {
  function AddIcon() {
    return React.createElement('span', { 'data-testid': 'add-icon' });
  }
  return {
    __esModule: true,
    default: AddIcon,
  };
});

jest.mock('@/app/_components/history/history-layout', () => ({
  HistoryLayout: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', {}, children),
  HistoryHeader: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', {}, children),
  HistoryTitle: ({ children }: { children: React.ReactNode }) =>
    React.createElement('h1', {}, children),
  HistoryContent: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', {}, children),
}));

jest.mock('@/app/_components/search-box', () => ({
  __esModule: true,
  default: ({ placeholder, value, onChange }: any) =>
    React.createElement('input', { placeholder, value, onChange }),
}));

jest.mock('@/app/_components/chat/thread-list', () => ({
  __esModule: true,
  default: ({ threads, deleteThread }: any) =>
    React.createElement(
      'div',
      { 'data-testid': 'thread-list' },
      threads.map((t: any) =>
        React.createElement('button', { key: t.id, onClick: () => deleteThread(t.id) }, t.title)
      )
    ),
}));

jest.mock('@/app/_components/ui/button', () => ({
  Button: ({ children, onClick, disabled }: any) =>
    React.createElement('button', { onClick, disabled }, children),
}));

jest.mock('@/app/(dashboard)/chat/_components/clear-threads-button', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'clear-threads-button' }),
}));

jest.mock('@/app/(dashboard)/chat/_actions/createChatThread', () => ({
  createChatThread: jest.fn(),
}));

jest.mock('@/app/(dashboard)/chat/_actions/clearChatThread', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import { toast } from 'sonner';
import clearChatThread from '@/app/(dashboard)/chat/_actions/clearChatThread';
import { createChatThread } from '@/app/(dashboard)/chat/_actions/createChatThread';
import ChatHistory from '@/app/(dashboard)/chat/_components/chat-history';

describe('ChatHistory', () => {
  beforeEach(() => {
    pushMock.mockReset();
    (toast.success as jest.Mock).mockReset();
    (toast.error as jest.Mock).mockReset();
    (createChatThread as jest.Mock).mockReset();
    (clearChatThread as jest.Mock).mockReset();
  });

  test('L-01-001: threads が空なら全削除ボタンを表示しない', () => {
    render(React.createElement(ChatHistory, { threads: [] }));

    expect(screen.queryByTestId('clear-threads-button')).not.toBeInTheDocument();
  });

  test('N-01-001: threads が存在するなら全削除ボタンを表示する', () => {
    render(
      React.createElement(ChatHistory, {
        threads: [{ id: 't1', title: 'Hello' }],
      })
    );

    expect(screen.getByTestId('clear-threads-button')).toBeInTheDocument();
  });

  test('N-01-002: 検索語で ThreadList に渡るスレッドが絞り込まれる', () => {
    render(
      React.createElement(ChatHistory, {
        threads: [
          { id: 't1', title: 'Alpha' },
          { id: 't2', title: 'Beta' },
        ],
      })
    );

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('チャットを検索'), { target: { value: 'alp' } });

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();
  });

  test('N-01-003: 追加ボタンで createChatThread 成功時に /chat/:id へ遷移する', async () => {
    (createChatThread as jest.Mock).mockResolvedValue({ success: true, id: 'new-id' });

    render(React.createElement(ChatHistory, { threads: [{ id: 't1', title: 'Hello' }] }));

    fireEvent.click(screen.getAllByRole('button')[0]);

    await waitFor(() => {
      expect(createChatThread).toHaveBeenCalledTimes(1);
    });

    expect(pushMock).toHaveBeenCalledWith('/chat/new-id');
  });

  test('E-01-001: createChatThread 失敗時は toast.error を出す', async () => {
    (createChatThread as jest.Mock).mockResolvedValue({ success: false });

    render(React.createElement(ChatHistory, { threads: [{ id: 't1', title: 'Hello' }] }));

    fireEvent.click(screen.getAllByRole('button')[0]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('チャットの作成に失敗しました');
    });
  });

  test('N-01-004: 削除成功で toast.success / push(/chat) する', async () => {
    (clearChatThread as jest.Mock).mockResolvedValue({ success: true });

    render(
      React.createElement(ChatHistory, {
        threads: [{ id: 't1', title: 'Hello' }],
      })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Hello' }));

    await waitFor(() => {
      expect(clearChatThread).toHaveBeenCalledWith('t1');
    });

    expect(toast.success).toHaveBeenCalledWith('I_F_00010:チャット');
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/chat');
    });
  });

  test('E-01-002: 削除失敗で message があればそれを toast.error に表示する', async () => {
    (clearChatThread as jest.Mock).mockResolvedValue({ success: false, message: 'custom-error' });

    render(
      React.createElement(ChatHistory, {
        threads: [{ id: 't1', title: 'Hello' }],
      })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Hello' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('custom-error');
    });
  });

  test('E-01-003: 削除失敗で message が無ければ getMessage の内容を toast.error に表示する', async () => {
    (clearChatThread as jest.Mock).mockResolvedValue({ success: false });

    render(
      React.createElement(ChatHistory, {
        threads: [{ id: 't1', title: 'Hello' }],
      })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Hello' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('E_F_00030:チャット');
    });
  });

  test('L-01-002: isLoading 中の deleteThread は早期returnして二重実行しない', async () => {
    let resolveFirst: (value: unknown) => void;
    const firstCallPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });
    (clearChatThread as jest.Mock).mockReturnValue(firstCallPromise);

    render(
      React.createElement(ChatHistory, {
        threads: [{ id: 't1', title: 'Hello' }],
      })
    );

    // 1回目のクリックで isLoading=true になり、2回目は早期return される想定
    fireEvent.click(screen.getByRole('button', { name: 'Hello' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hello' }));

    expect(clearChatThread).toHaveBeenCalledTimes(1);

    resolveFirst!({ success: true });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('I_F_00010:チャット');
    });
  });

  test('I-01-001: 検索で絞り込んだスレッドを削除できる（filter → ThreadList → deleteThread）', async () => {
    (clearChatThread as jest.Mock).mockResolvedValue({ success: true });

    render(
      React.createElement(ChatHistory, {
        threads: [
          { id: 't1', title: 'Alpha' },
          { id: 't2', title: 'Beta' },
        ],
      })
    );

    fireEvent.change(screen.getByPlaceholderText('チャットを検索'), { target: { value: 'alp' } });

    // 絞り込まれた Alpha をクリックして削除
    fireEvent.click(screen.getByRole('button', { name: 'Alpha' }));

    await waitFor(() => {
      expect(clearChatThread).toHaveBeenCalledWith('t1');
    });
    expect(toast.success).toHaveBeenCalledWith('I_F_00010:チャット');
  });
});
