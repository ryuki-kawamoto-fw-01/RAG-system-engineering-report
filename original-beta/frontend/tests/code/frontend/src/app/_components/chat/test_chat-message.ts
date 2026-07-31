/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
  },
}));

jest.mock('@/app/_utils/message', () => ({
  getMessage: (code: string) => code,
}));

jest.mock('@/app/_utils/date', () => ({
  formatDate: () => '12:34',
}));

jest.mock('@/app/_components/chat/assistant-avatar', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'assistant-avatar' }),
}));

jest.mock('@/app/_components/ui/markdown', () => ({
  __esModule: true,
  default: ({ children }: any) =>
    React.createElement('div', { 'data-testid': 'markdown' }, children),
}));

jest.mock('@/app/_components/ui/image-modal', () => ({
  __esModule: true,
  default: ({ src }: any) => React.createElement('img', { 'data-testid': 'image-modal', src }),
}));

jest.mock('@/app/_components/ui/text-link', () => ({
  __esModule: true,
  default: ({ href, children }: any) => React.createElement('a', { href }, children),
}));

jest.mock('@/app/_components/ui/button', () => ({
  Button: ({ children, ...props }: any) => React.createElement('button', props, children),
}));

jest.mock('@/app/_components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => React.createElement(React.Fragment, {}, children),
  Tooltip: ({ children }: any) => React.createElement(React.Fragment, {}, children),
  TooltipTrigger: ({ children }: any) => React.createElement(React.Fragment, {}, children),
  TooltipContent: ({ children }: any) => React.createElement('div', {}, children),
}));

jest.mock('@/app/_components/icon/button/Copy', () => ({
  __esModule: true,
  default: () => React.createElement('span', { 'data-testid': 'copy-icon' }),
}));

jest.mock('@/app/_components/icon/button/Download', () => ({
  __esModule: true,
  default: () => React.createElement('span', { 'data-testid': 'download-icon' }),
}));

jest.mock('@/app/_components/chat/feedback-good-button', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'fb-good' }),
}));

jest.mock('@/app/_components/chat/feedback-bad-button', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'fb-bad' }),
}));

import { toast } from 'sonner';
import ChatMessage from '@/app/_components/chat/chat-message';

describe('ChatMessage', () => {
  beforeEach(() => {
    (toast.success as jest.Mock).mockClear();
    (navigator as any).clipboard = { writeText: jest.fn() };
    (URL as any).createObjectURL = jest.fn(() => 'blob:x');
  });

  test('N-01-001: user メッセージはアバター/フィードバックを表示しない', () => {
    render(
      React.createElement(ChatMessage, {
        message: { id: '1', role: 'user', content: 'hi', createdAt: new Date() } as any,
      })
    );

    expect(screen.queryByTestId('assistant-avatar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('fb-good')).not.toBeInTheDocument();
    expect(screen.getByTestId('markdown')).toHaveTextContent('hi');
  });

  test('N-01-002: assistant はコピー/DL/フィードバックを表示し、コピーでクリップボードへ書き込む', () => {
    render(
      React.createElement(ChatMessage, {
        message: { id: '1', role: 'assistant', content: 'answer', createdAt: new Date() } as any,
      })
    );

    expect(screen.getByTestId('assistant-avatar')).toBeInTheDocument();
    expect(screen.getByTestId('fb-good')).toBeInTheDocument();
    expect(screen.getByTestId('fb-bad')).toBeInTheDocument();

    // 先頭のボタンが copy になる想定（アイコンで識別）
    const copyBtn = screen.getByTestId('copy-icon').closest('button')!;
    fireEvent.click(copyBtn);
    expect((navigator as any).clipboard.writeText).toHaveBeenCalledWith('answer');
    expect(toast.success).toHaveBeenCalledWith('I_F_00050');
  });

  test('I-01-001: 添付画像がある場合は ImageModal に data:image を渡す', () => {
    render(
      React.createElement(ChatMessage, {
        message: {
          id: '1',
          role: 'assistant',
          content: 'x',
          createdAt: new Date(),
          file_name: 'p.jpg',
          file_content: 'BASE64',
        } as any,
      })
    );

    expect(screen.getByTestId('image-modal')).toHaveAttribute(
      'src',
      'data:image/jpeg;base64,BASE64'
    );
  });

  test('L-01-001: getMimeType の分岐（gif/webp/不明拡張子）をカバーする', () => {
    const base = {
      id: '1',
      role: 'assistant',
      content: 'x',
      createdAt: new Date(),
      file_content: 'BASE64',
    };

    const { rerender } = render(
      React.createElement(ChatMessage, { message: { ...base, file_name: 'a.gif' } as any })
    );
    expect(screen.getByTestId('image-modal')).toHaveAttribute(
      'src',
      'data:image/gif;base64,BASE64'
    );

    rerender(
      React.createElement(ChatMessage, { message: { ...base, file_name: 'a.webp' } as any })
    );
    expect(screen.getByTestId('image-modal')).toHaveAttribute(
      'src',
      'data:image/webp;base64,BASE64'
    );

    rerender(React.createElement(ChatMessage, { message: { ...base, file_name: 'a.png' } as any }));
    expect(screen.getByTestId('image-modal')).toHaveAttribute(
      'src',
      'data:image/png;base64,BASE64'
    );

    rerender(
      React.createElement(ChatMessage, { message: { ...base, file_name: 'a.unknown' } as any })
    );
    expect(screen.getByTestId('image-modal')).toHaveAttribute(
      'src',
      'data:image/png;base64,BASE64'
    );
  });

  test('I-01-003: ダウンロードボタンでファイルDL処理が走り toast.success(I_F_00060) が呼ばれる', () => {
    const appendSpy = jest.spyOn(document.body, 'appendChild');
    const removeSpy = jest.spyOn(document.body, 'removeChild');

    render(
      React.createElement(ChatMessage, {
        message: { id: '1', role: 'assistant', content: 'answer', createdAt: new Date() } as any,
      })
    );

    const dlBtn = screen.getByTestId('download-icon').closest('button')!;
    fireEvent.click(dlBtn);

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('I_F_00060');
  });

  test('N-01-003: seasonalEvent がある場合は Markdown を使わず内容を表示する', () => {
    render(
      React.createElement(ChatMessage, {
        message: {
          id: '1',
          role: 'assistant',
          content: 'season',
          createdAt: new Date(),
          seasonalEvent: 'x',
        } as any,
      })
    );
    expect(screen.queryByTestId('markdown')).not.toBeInTheDocument();
    expect(screen.getByText('season')).toBeInTheDocument();
  });

  test('L-01-002: feedbackEnabled=false の場合はフィードバックUIを表示しない', () => {
    render(
      React.createElement(ChatMessage, {
        feedbackEnabled: false,
        message: { id: '1', role: 'assistant', content: 'x', createdAt: new Date() } as any,
      })
    );
    expect(screen.queryByTestId('fb-good')).not.toBeInTheDocument();
    expect(screen.queryByTestId('fb-bad')).not.toBeInTheDocument();
  });

  test('I-01-002: 検索結果がある場合は引用元リストを表示する', () => {
    render(
      React.createElement(ChatMessage, {
        message: {
          id: '1',
          role: 'assistant',
          content: 'x',
          createdAt: new Date(),
          searchResults: [{ id: 1, title: 't', url: 'https://example.com', snippet: 's' }],
        } as any,
      })
    );

    expect(screen.getByText('引用元：')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 't' })).toHaveAttribute('href', 'https://example.com');
  });

  test('L-01-003: fileName が undefined の場合は ImageModal を表示しない（条件チェックで弾かれる）', () => {
    render(
      React.createElement(ChatMessage, {
        message: {
          id: '1',
          role: 'assistant',
          content: 'x',
          createdAt: new Date(),
          file_name: undefined,
          file_content: 'BASE64',
        } as any,
      })
    );
    // file_name が undefined だと条件 `message.file_name && message.file_content` が false になる
    expect(screen.queryByTestId('image-modal')).not.toBeInTheDocument();
  });

  test('L-01-005: file_name が1回目truthy→2回目undefinedになる場合でも getMimeType の fileName未指定分岐が通る', () => {
    const msg: any = {
      id: '1',
      role: 'assistant',
      content: 'x',
      createdAt: new Date(),
      file_content: 'BASE64',
    };
    let calls = 0;
    Object.defineProperty(msg, 'file_name', {
      configurable: true,
      get() {
        calls += 1;
        return calls === 1 ? 'a.png' : undefined;
      },
    });

    render(React.createElement(ChatMessage, { message: msg } as any));

    // getMimeType(undefined) の結果は png
    expect(screen.getByTestId('image-modal')).toHaveAttribute(
      'src',
      'data:image/png;base64,BASE64'
    );
  });

  test('L-01-004: createdAt が undefined の場合は時刻ブロック自体が表示されない', () => {
    render(
      React.createElement(ChatMessage, {
        message: {
          id: '1',
          role: 'assistant',
          content: 'x',
          createdAt: undefined,
        } as any,
      })
    );
    // createdAt が undefined だと message.createdAt 条件で時刻ブロックが表示されない
    // コピー/DLボタンなども表示されない
    expect(screen.queryByTestId('copy-icon')).not.toBeInTheDocument();
  });

  test('L-01-006: createdAt が1回目truthy→2回目undefined の場合、時刻の三項演算子で空文字分岐になる', () => {
    const msg: any = {
      id: '1',
      role: 'assistant',
      content: 'x',
    };
    let calls = 0;
    Object.defineProperty(msg, 'createdAt', {
      configurable: true,
      get() {
        calls += 1;
        return calls === 1 ? new Date() : undefined;
      },
    });

    const { container } = render(React.createElement(ChatMessage, { message: msg } as any));

    // createdAt ブロック自体は描画されるが、内側の三項演算子は空文字側
    const time = container.querySelector('.text-2xs') as HTMLElement | null;
    expect(time).toBeTruthy();
    expect(time?.textContent).toBe('');
  });
});
