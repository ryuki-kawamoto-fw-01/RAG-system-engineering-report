/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

let selectedModel: any = 'gpt-5.2';

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/app/_store/hooks', () => ({
  useAppSelector: (selector: any) => selector({ model: { chat_selectedModel: selectedModel } }),
}));

jest.mock('@/app/_components/icon/button/Settings', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: any) =>
      React.createElement('span', { 'data-testid': 'settings-icon', ...props }),
  };
});

jest.mock('@/app/_components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) =>
    React.createElement(
      'div',
      { 'data-testid': 'dialog', 'data-open': String(open) },
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: () => onOpenChange?.(true),
        },
        '__open_dialog__'
      ),
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: () => onOpenChange?.(false),
        },
        '__close_dialog__'
      ),
      children
    ),
  DialogContent: ({ children }: any) => React.createElement('div', {}, children),
  DialogFooter: ({ children }: any) => React.createElement('div', {}, children),
  DialogHeader: ({ children }: any) => React.createElement('div', {}, children),
  DialogTitle: ({ children }: any) => React.createElement('h2', {}, children),
}));

jest.mock('@/app/_components/ui/button', () => ({
  Button: ({ children, ...props }: any) => React.createElement('button', props, children),
}));

jest.mock('@/app/_components/ui/radio-card-list', () => ({
  __esModule: true,
  default: ({ value, options, onChange }: any) =>
    React.createElement(
      'select',
      {
        'aria-label': 'model',
        value,
        onChange: (e: any) => onChange(e.target.value),
      },
      options.map((o: any) =>
        React.createElement('option', { key: o.value, value: o.value }, o.label ?? o.value)
      )
    ),
}));

jest.mock('@/app/_components/ui/form', () => {
  const React = require('react');
  const { useController } = require('react-hook-form');
  return {
    Form: ({ children }: any) => React.createElement(React.Fragment, {}, children),
    FormField: ({ name, control, render }: any) => {
      const { field } = useController({ name, control });
      return render({ field });
    },
    FormItem: ({ children, className }: any) => React.createElement('div', { className }, children),
    FormLabel: ({ children, className }: any) =>
      React.createElement('label', { className }, children),
  };
});

import { toast } from 'sonner';
import ParameterSettingsButton from '@/app/(dashboard)/chat/[id]/_components/parameter-settings-button';

describe('ParameterSettingsButton', () => {
  beforeEach(() => {
    (toast.success as jest.Mock).mockReset();
    selectedModel = 'gpt-5.2';
  });

  test('N-01-001: 初期状態ではダイアログは閉じている', () => {
    render(React.createElement(ParameterSettingsButton, { onSettingsChange: jest.fn() }));
    expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'false');
  });

  test('N-01-002: 設定アイコン押下でダイアログが開く', () => {
    render(React.createElement(ParameterSettingsButton, { onSettingsChange: jest.fn() }));
    fireEvent.click(screen.getByTestId('settings-icon'));
    expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'true');
  });

  test('N-01-003: Dialog の onOpenChange(true) でダイアログが開く', () => {
    render(React.createElement(ParameterSettingsButton, { onSettingsChange: jest.fn() }));
    fireEvent.click(screen.getByRole('button', { name: '__open_dialog__' }));
    expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'true');
  });

  test('N-01-004: モデル選択→設定で onSettingsChange が呼ばれる', async () => {
    const onSettingsChange = jest.fn();

    render(React.createElement(ParameterSettingsButton, { onSettingsChange }));

    // モデルを変更
    fireEvent.change(screen.getByLabelText('model'), { target: { value: 'gpt-4.1' } });

    // submit
    fireEvent.click(screen.getByRole('button', { name: '設定する' }));

    await waitFor(() => {
      expect(onSettingsChange).toHaveBeenCalledWith('gpt-4.1');
    });

    expect(toast.success).toHaveBeenCalledWith('パラメータ設定を更新しました');
  });

  test('E-01-001: 不正なモデル値では onSettingsChange が呼ばれない', async () => {
    const onSettingsChange = jest.fn();

    render(React.createElement(ParameterSettingsButton, { onSettingsChange }));

    fireEvent.change(screen.getByLabelText('model'), { target: { value: 'invalid-model' } });
    fireEvent.click(screen.getByRole('button', { name: '設定する' }));

    await waitFor(() => {
      expect(onSettingsChange).not.toHaveBeenCalled();
    });
  });

  test('E-01-002: model が空文字の場合は onSettingsChange が呼ばれない', async () => {
    const onSettingsChange = jest.fn();

    render(React.createElement(ParameterSettingsButton, { onSettingsChange }));

    fireEvent.change(screen.getByLabelText('model'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: '設定する' }));

    await waitFor(() => {
      expect(onSettingsChange).not.toHaveBeenCalled();
    });
  });

  test('L-01-001: selectedModel が undefined の場合は DEFAULT_MODEL を初期値にする', () => {
    selectedModel = undefined;
    render(React.createElement(ParameterSettingsButton, { onSettingsChange: jest.fn() }));
    expect(screen.getByLabelText('model')).toHaveValue('gpt-5.2');
  });

  test('L-01-002: キャンセルでダイアログを閉じ、フォームをリセットする', () => {
    render(React.createElement(ParameterSettingsButton, { onSettingsChange: jest.fn() }));

    fireEvent.click(screen.getByTestId('settings-icon'));
    fireEvent.change(screen.getByLabelText('model'), { target: { value: 'gpt-4.1' } });
    expect(screen.getByLabelText('model')).toHaveValue('gpt-4.1');

    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }));
    expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'false');
    expect(screen.getByLabelText('model')).toHaveValue('gpt-5.2');
  });

  test('L-01-003: Dialog の onOpenChange(false) で閉じ、フォームをリセットする', () => {
    render(React.createElement(ParameterSettingsButton, { onSettingsChange: jest.fn() }));
    fireEvent.click(screen.getByTestId('settings-icon'));
    fireEvent.change(screen.getByLabelText('model'), { target: { value: 'gpt-4.1' } });
    fireEvent.click(screen.getByRole('button', { name: '__close_dialog__' }));
    expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'false');
    expect(screen.getByLabelText('model')).toHaveValue('gpt-5.2');
  });

  test('I-01-001: selectedModel 変更に追従してフォームがリセットされる', () => {
    const onSettingsChange = jest.fn();

    const { rerender } = render(React.createElement(ParameterSettingsButton, { onSettingsChange }));
    expect(screen.getByLabelText('model')).toHaveValue('gpt-5.2');

    selectedModel = 'gpt-4.1';
    rerender(React.createElement(ParameterSettingsButton, { onSettingsChange }));
    expect(screen.getByLabelText('model')).toHaveValue('gpt-4.1');
  });
});
