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

jest.mock('@/app/_components/icon/button/Delete', () => {
  function DeleteIcon() {
    return React.createElement('span', { 'data-testid': 'delete-icon' });
  }
  return {
    __esModule: true,
    default: DeleteIcon,
  };
});

jest.mock('@/app/_components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? React.createElement('div', { 'data-testid': 'dialog' }, children) : null,
  DialogContent: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'dialog-content' }, children),
  DialogFooter: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'dialog-footer' }, children),
  DialogHeader: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'dialog-header' }, children),
  DialogTitle: ({ children }: { children: React.ReactNode }) =>
    React.createElement('h2', {}, children),
}));

jest.mock('@/app/_components/ui/button', () => ({
  Button: ({ children, onClick, disabled }: any) =>
    React.createElement('button', { onClick, disabled }, children),
}));

jest.mock('@/app/(dashboard)/chat/_actions/clearChatThreads', () => ({
  clearChatThreads: jest.fn(),
}));

import { toast } from 'sonner';
import { clearChatThreads } from '@/app/(dashboard)/chat/_actions/clearChatThreads';
import ClearThreadsButton from '@/app/(dashboard)/chat/_components/clear-threads-button';

describe('ClearThreadsButton', () => {
  beforeEach(() => {
    pushMock.mockReset();
    (toast.success as jest.Mock).mockReset();
    (toast.error as jest.Mock).mockReset();
    (clearChatThreads as jest.Mock).mockReset();
  });

  test('N-01-001: ボタン押下で確認ダイアログが開く', () => {
    render(React.createElement(ClearThreadsButton));

    fireEvent.click(screen.getByRole('button', { name: '全てを削除' }));

    expect(screen.getByText('全てのチャットを削除しますか？')).toBeInTheDocument();
    expect(screen.getByText('一度削除すると元に戻すことはできません。')).toBeInTheDocument();
  });

  test('N-01-002: キャンセルでダイアログが閉じる', () => {
    render(React.createElement(ClearThreadsButton));

    fireEvent.click(screen.getByRole('button', { name: '全てを削除' }));
    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }));

    expect(screen.queryByText('全てのチャットを削除しますか？')).not.toBeInTheDocument();
  });

  test('I-01-001: 全削除成功で toast.success / push(/chat) されダイアログが閉じる', async () => {
    (clearChatThreads as jest.Mock).mockResolvedValue({ success: true });

    render(React.createElement(ClearThreadsButton));

    fireEvent.click(screen.getByRole('button', { name: '全てを削除' }));
    fireEvent.click(screen.getByRole('button', { name: '全て削除する' }));

    await waitFor(() => {
      expect(clearChatThreads).toHaveBeenCalledTimes(1);
    });

    expect(toast.success).toHaveBeenCalledWith('I_F_00020:チャット');
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/chat');
    });

    expect(screen.queryByText('全てのチャットを削除しますか？')).not.toBeInTheDocument();
  });

  test('E-01-001: 全削除失敗で toast.error / push(/chat) されダイアログは閉じない', async () => {
    (clearChatThreads as jest.Mock).mockResolvedValue({ success: false });

    render(React.createElement(ClearThreadsButton));

    fireEvent.click(screen.getByRole('button', { name: '全てを削除' }));
    fireEvent.click(screen.getByRole('button', { name: '全て削除する' }));

    await waitFor(() => {
      expect(clearChatThreads).toHaveBeenCalledTimes(1);
    });

    expect(toast.error).toHaveBeenCalledWith('E_F_00040:チャット');
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/chat');
    });

    // 失敗時は setIsOpen(false) しないため、ダイアログが残る
    expect(screen.getByText('全てのチャットを削除しますか？')).toBeInTheDocument();
  });

  test('E-01-002: 全削除失敗後は isLoading が解除されボタンが再度操作可能になる', async () => {
    let resolveFn: (value: unknown) => void;
    const pending = new Promise((resolve) => {
      resolveFn = resolve;
    });
    (clearChatThreads as jest.Mock).mockReturnValue(pending);

    render(React.createElement(ClearThreadsButton));

    const openButton = screen.getByRole('button', { name: '全てを削除' });
    fireEvent.click(openButton);
    fireEvent.click(screen.getByRole('button', { name: '全て削除する' }));

    // 実行中は disabled
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '全て削除する' })).toBeDisabled();
    expect(openButton).toBeDisabled();

    resolveFn!({ success: false });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('E_F_00040:チャット');
    });

    // 完了後は再度操作可能（ダイアログは残る仕様）
    expect(screen.getByRole('button', { name: 'キャンセル' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: '全て削除する' })).not.toBeDisabled();
    expect(openButton).not.toBeDisabled();
  });

  test('L-01-001: 実行中は確認/キャンセルが disabled になり操作できない', async () => {
    let resolveFn: (value: unknown) => void;
    const pending = new Promise((resolve) => {
      resolveFn = resolve;
    });
    (clearChatThreads as jest.Mock).mockReturnValue(pending);

    render(React.createElement(ClearThreadsButton));

    fireEvent.click(screen.getByRole('button', { name: '全てを削除' }));
    fireEvent.click(screen.getByRole('button', { name: '全て削除する' }));

    // isLoading=true の間は両ボタンとも disabled
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '全て削除する' })).toBeDisabled();

    resolveFn!({ success: true });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('I_F_00020:チャット');
    });
  });

  test('L-01-002: 実行中に「全て削除する」を連打しても clearChatThreads は1回だけ', async () => {
    let resolveFn: (value: unknown) => void;
    const pending = new Promise((resolve) => {
      resolveFn = resolve;
    });
    (clearChatThreads as jest.Mock).mockReturnValue(pending);

    render(React.createElement(ClearThreadsButton));

    fireEvent.click(screen.getByRole('button', { name: '全てを削除' }));
    const confirm = screen.getByRole('button', { name: '全て削除する' });

    fireEvent.click(confirm);
    fireEvent.click(confirm);

    expect(clearChatThreads).toHaveBeenCalledTimes(1);

    resolveFn!({ success: true });
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/chat');
    });
  });

  test('L-01-003: 実行中は「全てを削除」ボタン自体も disabled になる', async () => {
    let resolveFn: (value: unknown) => void;
    const pending = new Promise((resolve) => {
      resolveFn = resolve;
    });
    (clearChatThreads as jest.Mock).mockReturnValue(pending);

    render(React.createElement(ClearThreadsButton));

    // ダイアログを開いて削除開始
    const openButton = screen.getByRole('button', { name: '全てを削除' });
    fireEvent.click(openButton);
    fireEvent.click(screen.getByRole('button', { name: '全て削除する' }));

    expect(openButton).toBeDisabled();

    resolveFn!({ success: true });
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('I_F_00020:チャット');
    });
  });
});
