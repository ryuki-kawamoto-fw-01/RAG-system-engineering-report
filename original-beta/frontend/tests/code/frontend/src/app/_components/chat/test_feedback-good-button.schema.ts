/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/app/_utils/message', () => ({
  getMessage: (code: string) => code,
}));

jest.mock('../../../../config', () => ({
  badFeedbackOptions: [{ id: 'r1', label: '理由1' }],
  goodFeedbackOptions: [{ id: 'r1', label: '理由1' }],
}));

jest.mock('@/app/_components/icon/button/Good', () => ({
  __esModule: true,
  default: () => React.createElement('span', { 'data-testid': 'good-icon' }),
}));

jest.mock('@/app/_components/icon/button/DisabledGood', () => ({
  __esModule: true,
  default: () => React.createElement('span', { 'data-testid': 'good-icon-disabled' }),
}));

jest.mock('@/app/_components/ui/optional-label', () => ({
  __esModule: true,
  default: ({ children }: any) => React.createElement('div', {}, children),
}));

jest.mock('@/app/_components/ui/required-label', () => ({
  __esModule: true,
  default: ({ children }: any) => React.createElement('div', {}, children),
}));

jest.mock('@/app/_components/ui/button', () => ({
  Button: ({ children, ...props }: any) => React.createElement('button', props, children),
}));

jest.mock('@/app/_components/ui/input', () => ({
  Input: (props: any) => React.createElement('input', props),
}));

jest.mock('@/app/_components/ui/checkbox', () => ({
  Checkbox: ({ onCheckedChange, checked }: any) =>
    React.createElement('button', {
      type: 'button',
      'data-testid': 'checkbox',
      'data-checked': String(!!checked),
      onClick: () => onCheckedChange?.(!checked),
    }),
}));

jest.mock('@/app/_components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => React.createElement(React.Fragment, {}, children),
  Tooltip: ({ children }: any) => React.createElement(React.Fragment, {}, children),
  TooltipTrigger: ({ children }: any) => React.createElement(React.Fragment, {}, children),
  TooltipContent: ({ children }: any) => React.createElement('div', {}, children),
}));

jest.mock('@/app/_components/ui/dialog', () => ({
  Dialog: ({ children }: any) => React.createElement('div', { 'data-testid': 'dialog' }, children),
  DialogContent: ({ children }: any) => React.createElement('div', {}, children),
  DialogFooter: ({ children }: any) => React.createElement('div', {}, children),
  DialogHeader: ({ children }: any) => React.createElement('div', {}, children),
  DialogTitle: ({ children }: any) => React.createElement('h2', {}, children),
}));

jest.mock('@/app/_components/icon/decorative/Warning', () => ({
  __esModule: true,
  default: () => React.createElement('span', { 'data-testid': 'warn-icon' }),
}));

jest.mock('@/app/(dashboard)/chat/[id]/_actions/feedbackChatMessage', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/app/(dashboard)/rag-chat/[id]/_actions/feedbackChatMessage', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/app/(dashboard)/agent/[task]/[id]/_actions/feedbackChatMessage', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import { toast } from 'sonner';
import feedbackChatMessage from '@/app/(dashboard)/chat/[id]/_actions/feedbackChatMessage';
import FeedbackGoodButton from '@/app/_components/chat/feedback-good-button';

describe('FeedbackGoodButton schema', () => {
  beforeEach(() => {
    (toast.success as jest.Mock).mockReset();
    (toast.error as jest.Mock).mockReset();
    (feedbackChatMessage as jest.Mock).mockReset();
  });

  test('E-VAL-001: 理由未選択で送信するとバリデーションエラーになり送信処理が呼ばれない', async () => {
    (feedbackChatMessage as jest.Mock).mockResolvedValue({ success: true });

    render(
      React.createElement(FeedbackGoodButton, {
        source: 'chat',
        messageId: 'm1',
        isSubmitted: false,
      })
    );

    fireEvent.click(screen.getByTestId('good-icon').closest('button')!);

    fireEvent.click(screen.getByRole('button', { name: '送信する' }));

    await waitFor(() => {
      expect(feedbackChatMessage).not.toHaveBeenCalled();
    });

    expect(
      await screen.findByText(/少なくとも1つのオプションを選択してくだ\s*さい/)
    ).toBeInTheDocument();
  });

  test('N-VAL-001: 理由を選択して送信すると送信処理が呼ばれる', async () => {
    (feedbackChatMessage as jest.Mock).mockResolvedValue({ success: true });

    render(
      React.createElement(FeedbackGoodButton, {
        source: 'chat',
        messageId: 'm1',
        isSubmitted: false,
      })
    );

    fireEvent.click(screen.getByTestId('good-icon').closest('button')!);

    fireEvent.click(screen.getByTestId('checkbox'));

    fireEvent.click(screen.getByRole('button', { name: '送信する' }));

    await waitFor(() => {
      expect(feedbackChatMessage).toHaveBeenCalledTimes(1);
    });
    expect(toast.success).toHaveBeenCalledWith('I_F_00070');
  });
});
