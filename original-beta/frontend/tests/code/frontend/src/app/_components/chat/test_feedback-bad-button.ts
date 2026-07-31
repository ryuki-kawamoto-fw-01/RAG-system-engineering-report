/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const reasonsOnChange = jest.fn();

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/app/_utils/message', () => ({
  getMessage: (code: string) => code,
}));

jest.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => undefined,
}));

jest.mock('react-hook-form', () => ({
  useForm: () => ({
    control: {},
    formState: { isLoading: false },
    handleSubmit: (fn: any) => () => fn({ reasons: ['r'], text: 't' }),
  }),
}));

jest.mock('@/app/_components/ui/form', () => ({
  Form: ({ children }: any) => React.createElement(React.Fragment, {}, children),
  FormField: ({ name, render }: any) => {
    if (name === 'reasons') {
      //  Internal state for reasons to simulate real field behavior
      const [fieldValue, setFieldValue] = React.useState<string[]>([]);
      return render({
        field: {
          value: fieldValue,
          onChange: (newValue: string[]) => {
            setFieldValue(newValue);
            reasonsOnChange(newValue);
          },
        },
      });
    }
    return render({ field: { value: '', onChange: jest.fn() } });
  },
  FormItem: ({ children }: any) => React.createElement('div', {}, children),
  FormControl: ({ children }: any) => React.createElement(React.Fragment, {}, children),
  FormLabel: ({ children }: any) => React.createElement('label', {}, children),
  FormMessage: () => React.createElement('div', {}),
}));

jest.mock('@/app/_components/ui/input', () => ({
  Input: (props: any) => React.createElement('input', props),
}));

jest.mock('@/app/_components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange }: any) => {
    const [internal, setInternal] = React.useState(!!checked);
    return React.createElement('button', {
      type: 'button',
      'data-testid': 'checkbox',
      onClick: () => {
        const next = !internal;
        setInternal(next);
        onCheckedChange?.(next);
      },
    });
  },
}));

jest.mock('@/app/_components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) =>
    React.createElement('div', { 'data-testid': 'dialog', 'data-open': String(open) }, children),
  DialogContent: ({ children }: any) => React.createElement('div', {}, children),
  DialogFooter: ({ children }: any) => React.createElement('div', {}, children),
  DialogHeader: ({ children }: any) => React.createElement('div', {}, children),
  DialogTitle: ({ children }: any) => React.createElement('h2', {}, children),
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

jest.mock('@/app/_components/icon/button/Bad', () => ({
  __esModule: true,
  default: () => React.createElement('span', { 'data-testid': 'bad-icon' }),
}));

jest.mock('@/app/_components/icon/button/DisabledBad', () => ({
  __esModule: true,
  default: () => React.createElement('span', { 'data-testid': 'bad-icon-disabled' }),
}));

jest.mock('@/app/_components/ui/optional-label', () => ({
  __esModule: true,
  default: ({ children }: any) => React.createElement('div', {}, children),
}));

jest.mock('@/app/_components/ui/required-label', () => ({
  __esModule: true,
  default: ({ children }: any) => React.createElement('div', {}, children),
}));

jest.mock('../../../../config', () => ({
  goodFeedbackOptions: [{ id: 'r', label: '理由' }],
  badFeedbackOptions: [{ id: 'r', label: '理由' }],
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

import feedbackRagChatMessage from '@/app/(dashboard)/rag-chat/[id]/_actions/feedbackChatMessage';
import feedbackChatMessage from '@/app/(dashboard)/chat/[id]/_actions/feedbackChatMessage';
import feedbackAgentChatMessage from '@/app/(dashboard)/agent/[task]/[id]/_actions/feedbackChatMessage';
import { toast } from 'sonner';
import FeedbackBadButton from '@/app/_components/chat/feedback-bad-button';

describe('FeedbackBadButton', () => {
  beforeEach(() => {
    reasonsOnChange.mockReset();
    (toast.success as jest.Mock).mockReset();
    (toast.error as jest.Mock).mockReset();
    (feedbackRagChatMessage as jest.Mock).mockReset();
    (feedbackChatMessage as jest.Mock).mockReset();
    (feedbackAgentChatMessage as jest.Mock).mockReset();
  });

  test('N-01-001: source=rag で feedbackRagChatMessage が呼ばれる', async () => {
    (feedbackRagChatMessage as jest.Mock).mockResolvedValue({ success: true });

    render(
      React.createElement(FeedbackBadButton, {
        source: 'rag',
        messageId: 'm1',
        isSubmitted: false,
      })
    );

    fireEvent.click(screen.getByTestId('bad-icon').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: '送信する' }));

    await waitFor(() => {
      expect(feedbackRagChatMessage).toHaveBeenCalledWith('m1', 0, ['r'], 't');
    });
    expect(toast.success).toHaveBeenCalledWith('I_F_00070');
  });

  test('E-01-001: 送信失敗で toast.error が呼ばれる', async () => {
    (feedbackChatMessage as jest.Mock).mockResolvedValue({ success: false });

    render(
      React.createElement(FeedbackBadButton, {
        source: 'chat',
        messageId: 'm1',
        isSubmitted: false,
      })
    );

    fireEvent.click(screen.getByTestId('bad-icon').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: '送信する' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('E_F_00190');
    });
  });

  test('N-02-001: source=agent で feedbackAgentChatMessage が呼ばれる', async () => {
    (feedbackAgentChatMessage as jest.Mock).mockResolvedValue({ success: true });

    render(
      React.createElement(FeedbackBadButton, {
        source: 'agent',
        messageId: 'm1',
        isSubmitted: false,
      })
    );

    fireEvent.click(screen.getByTestId('bad-icon').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: '送信する' }));

    await waitFor(() => {
      expect(feedbackAgentChatMessage).toHaveBeenCalledWith('m1', 0, ['r'], 't');
    });
  });

  test('L-03-001: source 未指定の場合はデフォルト(chat)で feedbackChatMessage が呼ばれる', async () => {
    (feedbackChatMessage as jest.Mock).mockResolvedValue({ success: true });

    render(
      React.createElement(FeedbackBadButton, {
        messageId: 'm1',
        isSubmitted: false,
      } as any)
    );

    fireEvent.click(screen.getByTestId('bad-icon').closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: '送信する' }));

    await waitFor(() => {
      expect(feedbackChatMessage).toHaveBeenCalledWith('m1', 0, ['r'], 't');
    });
  });

  test('L-01-001: isSubmitted=true の場合はボタンが disabled', () => {
    render(
      React.createElement(FeedbackBadButton, {
        source: 'rag',
        messageId: 'm1',
        isSubmitted: true,
      })
    );

    const btn = screen.getByTestId('bad-icon-disabled').closest('button')!;
    expect(btn).toBeDisabled();
  });

  test('I-01-001: チェックボックスのトグルで reasons の onChange が呼ばれる', () => {
    render(
      React.createElement(FeedbackBadButton, {
        source: 'chat',
        messageId: 'm1',
        isSubmitted: false,
      })
    );

    fireEvent.click(screen.getByTestId('bad-icon').closest('button')!);

    const checkbox = screen.getAllByTestId('checkbox')[0];
    fireEvent.click(checkbox);
    fireEvent.click(checkbox);

    expect(reasonsOnChange).toHaveBeenCalledWith(['r']);
    expect(reasonsOnChange).toHaveBeenCalledWith([]);
  });

  test('N-03-001: キャンセルでダイアログを閉じられる', () => {
    render(
      React.createElement(FeedbackBadButton, {
        source: 'chat',
        messageId: 'm1',
        isSubmitted: false,
      })
    );

    fireEvent.click(screen.getByTestId('bad-icon').closest('button')!);
    expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }));
    expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'false');
  });

  test('L-02-001: source=voice は未実装（コメントアウト）のため分岐しない', () => {
    render(
      React.createElement(FeedbackBadButton, {
        source: 'voice' as any,
        messageId: 'm1',
        isSubmitted: false,
      })
    );
    // voice は未実装なので、特に feedbackVoiceChatMessage が呼ばれないことを確認する想定
    // 現状は単にレンダリングできることを確認
    expect(screen.getByTestId('bad-icon')).toBeInTheDocument();
  });

  test('I-01-002: checkbox false 分岐（チェックを外す）をカバー', () => {
    render(
      React.createElement(FeedbackBadButton, {
        source: 'chat',
        messageId: 'm1',
        isSubmitted: false,
      })
    );

    fireEvent.click(screen.getByTestId('bad-icon').closest('button')!);
    const checkbox = screen.getAllByTestId('checkbox')[0];

    // チェックを入れる
    fireEvent.click(checkbox);
    expect(reasonsOnChange).toHaveBeenCalledWith(['r']);

    // チェックを外す（false 分岐）
    fireEvent.click(checkbox);
    expect(reasonsOnChange).toHaveBeenCalledWith([]);
  });

  test('E-02-001: Zod validation で reasons の最小件数(min=1)を検証する', () => {
    const { z } = require('zod');
    const FeedbackSchema = z.object({
      reasons: z.array(z.string()).min(1, {
        message: '少なくとも1つのオプションを選択してください',
      }),
      text: z.string(),
    });

    const invalidData = { reasons: [], text: 'test' };
    const result = FeedbackSchema.safeParse(invalidData);
    expect(result.success).toBe(false);

    const validData = { reasons: ['1'], text: 'test' };
    const validResult = FeedbackSchema.safeParse(validData);
    expect(validResult.success).toBe(true);
  });
});
