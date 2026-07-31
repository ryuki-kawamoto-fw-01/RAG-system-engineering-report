/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('@/app/_hooks/use-media-query', () => ({
  useMediaQuery: jest.fn(),
}));

jest.mock('@/app/_components/ui/button', () => ({
  Button: ({ children, ...props }: any) => React.createElement('button', props, children),
}));

jest.mock('@/app/_components/ui/textarea', () => ({
  Textarea: React.forwardRef(({ ...props }: any, ref: any) =>
    React.createElement('textarea', { ref, 'aria-label': 'chat-textarea', ...props })
  ),
}));

jest.mock('@/app/_components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => React.createElement(React.Fragment, {}, children),
  Tooltip: ({ children }: any) => React.createElement(React.Fragment, {}, children),
  TooltipTrigger: ({ children }: any) => React.createElement(React.Fragment, {}, children),
  TooltipContent: ({ children }: any) =>
    React.createElement('div', { 'data-testid': 'tooltip' }, children),
}));

jest.mock('@radix-ui/react-tooltip', () => ({
  Tooltip: ({ children }: any) => React.createElement(React.Fragment, {}, children),
}));

jest.mock('@/app/_components/icon/button/Attachment', () => ({
  __esModule: true,
  default: () => React.createElement('svg', { 'data-testid': 'attachment-icon' }),
}));

jest.mock('@/app/_components/icon/button/Send', () => ({
  __esModule: true,
  default: () => React.createElement('span', { 'data-testid': 'send-icon' }),
}));

jest.mock('@/app/_components/icon/button/SendPause', () => ({
  __esModule: true,
  default: () => React.createElement('span', { 'data-testid': 'send-pause-icon' }),
}));

jest.mock('@/app/_components/chat/attachment-list', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'attachment-list' }),
}));

import ChatBox from '@/app/_components/chat/chat-box';
import { useMediaQuery } from '@/app/_hooks/use-media-query';

describe('ChatBox', () => {
  beforeEach(() => {
    (HTMLFormElement.prototype as any).requestSubmit = jest.fn();
    (useMediaQuery as unknown as jest.Mock).mockReturnValue(false);
  });

  test('L-01-006: 2xl=true の場合は MAX_TEXTAREA_HEIGHT=282 でクランプされる', () => {
    (useMediaQuery as unknown as jest.Mock).mockReturnValue(true);

    render(
      React.createElement(
        'form',
        {},
        React.createElement(ChatBox, {
          defaultValue: 'x',
        })
      )
    );

    const textarea = screen.getByLabelText('chat-textarea') as HTMLTextAreaElement;
    Object.defineProperty(textarea, 'scrollHeight', { value: 999, configurable: true });

    fireEvent.input(textarea);
    expect(textarea.style.height).toBe('282px');
  });

  test('N-01-004: handleFileClick ありの場合は添付ボタンを表示し、クリックで呼ばれる', () => {
    const handleFileClick = jest.fn();

    render(
      React.createElement(
        'form',
        {},
        React.createElement(ChatBox, {
          handleFileClick,
        })
      )
    );

    const btn = screen.getByTestId('attachment-icon').closest('button')!;
    fireEvent.click(btn);
    expect(handleFileClick).toHaveBeenCalledTimes(1);
  });

  test('N-01-001: Enter で form.requestSubmit が呼ばれる（Shift+Enterは除く）', () => {
    render(
      React.createElement(
        'form',
        {},
        React.createElement(ChatBox, {
          defaultValue: 'x',
        })
      )
    );

    const textarea = screen.getByLabelText('chat-textarea');

    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
    expect((HTMLFormElement.prototype as any).requestSubmit).not.toHaveBeenCalled();

    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    expect((HTMLFormElement.prototype as any).requestSubmit).toHaveBeenCalledTimes(1);
  });

  test('E-01-001: isLoading/isDisabled 時は Enter 送信しない', () => {
    const { rerender } = render(
      React.createElement(
        'form',
        {},
        React.createElement(ChatBox, {
          isLoading: true,
        })
      )
    );
    fireEvent.keyDown(screen.getByLabelText('chat-textarea'), { key: 'Enter' });
    expect((HTMLFormElement.prototype as any).requestSubmit).not.toHaveBeenCalled();

    rerender(
      React.createElement(
        'form',
        {},
        React.createElement(ChatBox, {
          isDisabled: true,
        })
      )
    );
    fireEvent.keyDown(screen.getByLabelText('chat-textarea'), { key: 'Enter' });
    expect((HTMLFormElement.prototype as any).requestSubmit).not.toHaveBeenCalled();
  });

  test('L-01-001: 入力で高さが scrollHeight に合わせて伸縮する', () => {
    render(React.createElement(ChatBox));

    const textarea = screen.getByLabelText('chat-textarea') as HTMLTextAreaElement;
    Object.defineProperty(textarea, 'scrollHeight', { value: 50, configurable: true });
    fireEvent.input(textarea);

    expect(textarea.style.height).toBe('50px');
  });

  test('I-01-001: 添付あり&削除ハンドラありで AttachmentList を表示する', () => {
    render(
      React.createElement(ChatBox, {
        files: [{ file: new File(['x'], 'a.txt', { type: 'text/plain' }), url: 'blob:a' }] as any,
        handleFileDelete: jest.fn(),
      })
    );
    expect(screen.getByTestId('attachment-list')).toBeInTheDocument();
  });

  test('N-01-002: 余白クリックで textarea にフォーカスする', () => {
    render(React.createElement(ChatBox));
    const textarea = screen.getByLabelText('chat-textarea') as HTMLTextAreaElement;
    const focusSpy = jest.spyOn(textarea, 'focus');

    // container をクリック（svg ではない）
    fireEvent.click(textarea.parentElement as HTMLElement);
    expect(focusSpy).toHaveBeenCalled();
  });

  test('L-01-002: SVG アイコン上のクリックではフォーカスしない', () => {
    const handleFileClick = jest.fn();
    render(React.createElement(ChatBox, { handleFileClick }));
    const textarea = screen.getByLabelText('chat-textarea') as HTMLTextAreaElement;
    const focusSpy = jest.spyOn(textarea, 'focus');

    fireEvent.click(screen.getByTestId('attachment-icon'));
    expect(focusSpy).not.toHaveBeenCalled();
  });

  test('L-01-003: isLoading で textarea の高さが初期値にリセットされる', () => {
    const { rerender } = render(React.createElement(ChatBox, { isLoading: false }));
    const textarea = screen.getByLabelText('chat-textarea') as HTMLTextAreaElement;
    textarea.style.height = '100px';

    rerender(React.createElement(ChatBox, { isLoading: true }));
    expect(textarea.style.height).toBe('24px');
  });

  test('N-01-003: focus/blur でコンテナのクラスが切り替わる', () => {
    render(React.createElement(ChatBox));
    const textarea = screen.getByLabelText('chat-textarea') as HTMLTextAreaElement;
    const container = textarea.parentElement as HTMLElement;

    fireEvent.focus(textarea);
    expect(container.className).toContain('shadow-focus');

    fireEvent.blur(textarea);
    expect(container.className).not.toContain('shadow-focus');
  });

  test('L-01-004: handleFileClick なしの場合は添付ボタンを表示しない', () => {
    render(React.createElement(ChatBox));
    expect(screen.queryByTestId('attachment-icon')).not.toBeInTheDocument();
  });

  test('L-01-005: isLoading=false で送信ボタン、isLoading=true で一時停止ボタンを表示', () => {
    const { rerender } = render(React.createElement(ChatBox, { isLoading: false }));
    expect(screen.getByTestId('send-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('send-pause-icon')).not.toBeInTheDocument();

    rerender(React.createElement(ChatBox, { isLoading: true }));
    expect(screen.queryByTestId('send-icon')).not.toBeInTheDocument();
    expect(screen.getByTestId('send-pause-icon')).toBeInTheDocument();
  });
});
