/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    custom: jest.fn(),
    dismiss: jest.fn(),
  },
}));

jest.mock('@/app/_utils/message', () => ({
  getMessage: (code: string) => code,
}));

jest.mock('@/app/(dashboard)/template-register/_actions/getPromptTemplates', () => ({
  getPromptTemplates: jest.fn(),
}));

jest.mock('@/app/_constants/prompt-template', () => ({
  CATEGORY_VALUES: ['cat1', 'cat2'],
}));

jest.mock('@/app/_components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) =>
    React.createElement(
      'div',
      { 'data-testid': 'dialog', 'data-open': String(open) },
      open ? children : null
    ),
  DialogContent: ({ children }: any) => React.createElement('div', {}, children),
  DialogFooter: ({ children }: any) => React.createElement('div', {}, children),
  DialogHeader: ({ children }: any) => React.createElement('div', {}, children),
  DialogTitle: ({ children }: any) => React.createElement('h2', {}, children),
}));

jest.mock('@/app/_components/ui/button', () => ({
  // NOTE: native disabled button does not dispatch click events (jsdom/DOM spec).
  // We keep the disabled intent via data-disabled but allow click to fire to test
  // defensive branches like "selectedTemplate is null".
  Button: ({ children, disabled, onClick, ...props }: any) =>
    React.createElement(
      'button',
      { ...props, onClick, 'data-disabled': String(!!disabled) },
      children
    ),
}));

jest.mock('@/app/_components/ui/input', () => ({
  Input: (props: any) => React.createElement('input', props),
}));

jest.mock('@/app/_components/ui/label', () => ({
  Label: ({ children }: any) => React.createElement('label', {}, children),
}));

jest.mock('@/app/_components/ui/select', () => {
  let onValueChangeRef: ((value: string) => void) | undefined;

  return {
    Select: ({ children, onValueChange }: any) => {
      onValueChangeRef = onValueChange;
      return React.createElement(
        'div',
        { 'data-testid': 'select', 'data-onvaluechange': String(!!onValueChange) },
        children
      );
    },
    SelectTrigger: ({ children }: any) => React.createElement('div', {}, children),
    SelectValue: ({ placeholder }: any) => React.createElement('div', {}, placeholder),
    SelectContent: ({ children }: any) => React.createElement('div', {}, children),
    SelectGroup: ({ children }: any) => React.createElement('div', {}, children),
    SelectItem: ({ children, value }: any) =>
      React.createElement(
        'button',
        { type: 'button', onClick: () => onValueChangeRef?.(value) },
        children
      ),
  };
});

jest.mock('@/app/_components/ui/table', () => ({
  Table: ({ children }: any) => React.createElement('table', {}, children),
  TableHeader: ({ children }: any) => React.createElement('thead', {}, children),
  TableBody: ({ children }: any) => React.createElement('tbody', {}, children),
  TableRow: ({ children, onClick }: any) => React.createElement('tr', { onClick }, children),
  TableHead: ({ children }: any) => React.createElement('th', {}, children),
  TableCell: ({ children }: any) => React.createElement('td', {}, children),
}));

import { getPromptTemplates } from '@/app/(dashboard)/template-register/_actions/getPromptTemplates';
import { toast } from 'sonner';
import TemplateSelectorButton from '@/app/_components/chat/template-selector-button';

describe('TemplateSelectorButton', () => {
  beforeEach(() => {
    (getPromptTemplates as jest.Mock).mockReset();
    (toast.success as jest.Mock).mockReset();
    (toast.error as jest.Mock).mockReset();
    (toast.custom as jest.Mock).mockReset();
    (toast.dismiss as jest.Mock).mockReset();
  });

  test('N-01-001: input 空ならテンプレ選択→適用で setInput が呼ばれる', async () => {
    (getPromptTemplates as jest.Mock).mockResolvedValue({
      templates: [{ id: 't1', category: 'cat1', title: 'タイトル', content: '内容' }],
    });

    const setInput = jest.fn();
    render(React.createElement(TemplateSelectorButton, { input: '', setInput }));

    await waitFor(() => {
      expect(getPromptTemplates).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('button', { name: '他のテンプレートを選択する' }));
    expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'true');

    // テーブル行をクリックして選択
    fireEvent.click(screen.getByRole('cell', { name: 'タイトル' }));
    fireEvent.click(screen.getByRole('button', { name: '選択する' }));

    expect(setInput).toHaveBeenCalledWith('内容', 't1');
    expect(toast.success).toHaveBeenCalledWith('I_F_00080');
  });

  test('L-01-001: input 非空なら toast.custom を使って確認ダイアログを出す', async () => {
    (getPromptTemplates as jest.Mock).mockResolvedValue({
      templates: [{ id: 't1', category: 'cat1', title: 'タイトル', content: '内容' }],
    });

    const setInput = jest.fn();
    (toast.custom as jest.Mock).mockImplementation((renderer: any) => {
      // renderer は ReactNode を返す関数
      renderer({ id: 'toast1' });
    });

    render(React.createElement(TemplateSelectorButton, { input: 'x', setInput }));
    await waitFor(() => expect(getPromptTemplates).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: '他のテンプレートを選択する' }));
    fireEvent.click(screen.getByRole('cell', { name: 'タイトル' }));
    fireEvent.click(screen.getByRole('button', { name: '選択する' }));

    // toast.custom 自体が呼ばれていること
    expect(toast.custom).toHaveBeenCalled();
  });

  test('E-01-001: テンプレート取得に失敗した場合 toast.error(E_F_00200) が呼ばれる', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (getPromptTemplates as jest.Mock).mockRejectedValue(new Error('boom'));

    render(React.createElement(TemplateSelectorButton, { input: '', setInput: jest.fn() }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('E_F_00200');
    });

    consoleErrorSpy.mockRestore();
  });

  test('N-02-001: カテゴリーでフィルタできる', async () => {
    (getPromptTemplates as jest.Mock).mockResolvedValue({
      templates: [
        { id: 't1', category: 'cat1', title: 'T1', content: 'C1' },
        { id: 't2', category: 'cat2', title: 'T2', content: 'C2' },
      ],
    });

    render(React.createElement(TemplateSelectorButton, { input: '', setInput: jest.fn() }));
    await waitFor(() => expect(getPromptTemplates).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: '他のテンプレートを選択する' }));

    // SelectItem をボタンとしてモックしているので、クリックで onValueChange 相当を通す
    // ※コンポーネント側は value.replace('@','') を使う
    fireEvent.click(screen.getByRole('button', { name: 'cat1' }));

    await waitFor(() => {
      expect(screen.getByRole('cell', { name: 'T1' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('cell', { name: 'T2' })).not.toBeInTheDocument();
  });

  test('N-03-001: キーワード検索は日本語正規化（カタカナ→ひらがな等）を考慮する', async () => {
    (getPromptTemplates as jest.Mock).mockResolvedValue({
      templates: [
        { id: 't1', category: 'cat1', title: 'カタカナ', content: '内容' },
        { id: 't2', category: 'cat1', title: '別', content: 'べつ' },
      ],
    });

    render(React.createElement(TemplateSelectorButton, { input: '', setInput: jest.fn() }));
    await waitFor(() => expect(getPromptTemplates).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: '他のテンプレートを選択する' }));

    const keywordInput = screen.getByPlaceholderText('例：タイトルまたは内容');
    fireEvent.change(keywordInput, { target: { value: 'かたかな' } });

    await waitFor(() => {
      expect(screen.getByRole('cell', { name: 'カタカナ' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('cell', { name: '別' })).not.toBeInTheDocument();
  });

  test('L-02-001: input 非空の適用フローで「適用」を押すと setInput/成功toast/dismiss が呼ばれる', async () => {
    (getPromptTemplates as jest.Mock).mockResolvedValue({
      templates: [{ id: 't1', category: 'cat1', title: 'タイトル', content: '内容' }],
    });

    const setInput = jest.fn();
    const toastToken = { id: 'toast1' };
    (toast.custom as jest.Mock).mockImplementation((renderer: any) => {
      const node = renderer(toastToken);
      render(node);
    });

    render(React.createElement(TemplateSelectorButton, { input: 'x', setInput }));
    await waitFor(() => expect(getPromptTemplates).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: '他のテンプレートを選択する' }));
    fireEvent.click(screen.getByRole('cell', { name: 'タイトル' }));
    fireEvent.click(screen.getByRole('button', { name: '選択する' }));

    fireEvent.click(screen.getByRole('button', { name: '適用' }));

    expect(setInput).toHaveBeenCalledWith('内容', 't1');
    expect(toast.success).toHaveBeenCalledWith('I_F_00080');
    expect(toast.dismiss).toHaveBeenCalledWith(toastToken);
  });

  test('E-02-001: 選択なしで handleApplyTemplate が呼ばれると toast.error が呼ばれる（防御分岐）', async () => {
    (getPromptTemplates as jest.Mock).mockResolvedValue({ templates: [] });

    render(React.createElement(TemplateSelectorButton, { input: '', setInput: jest.fn() }));
    await waitFor(() => expect(getPromptTemplates).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: '他のテンプレートを選択する' }));

    const applyButton = screen.getByRole('button', { name: '選択する' }) as HTMLButtonElement;
    expect(applyButton).toHaveAttribute('data-disabled', 'true');
    fireEvent.click(applyButton);

    expect(toast.error).toHaveBeenCalledWith('テンプレートが選択されていません。');
  });

  test('L-03-001: input 非空の確認ダイアログで「キャンセル」を押すと dismiss され、setInput は呼ばれない', async () => {
    (getPromptTemplates as jest.Mock).mockResolvedValue({
      templates: [{ id: 't1', category: 'cat1', title: 'タイトル', content: '内容' }],
    });

    const setInput = jest.fn();
    const toastToken = { id: 'toast_cancel' };
    (toast.custom as jest.Mock).mockImplementation((renderer: any) => {
      const node = renderer(toastToken);
      render(node);
    });

    render(React.createElement(TemplateSelectorButton, { input: 'x', setInput }));
    await waitFor(() => expect(getPromptTemplates).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: '他のテンプレートを選択する' }));
    fireEvent.click(screen.getByRole('cell', { name: 'タイトル' }));
    fireEvent.click(screen.getByRole('button', { name: '選択する' }));

    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }));
    expect(toast.dismiss).toHaveBeenCalledWith(toastToken);
    expect(setInput).not.toHaveBeenCalled();
  });

  test('N-02-002: ダイアログの「キャンセル」で閉じられる', async () => {
    (getPromptTemplates as jest.Mock).mockResolvedValue({
      templates: [{ id: 't1', category: 'cat1', title: 'タイトル', content: '内容' }],
    });

    render(React.createElement(TemplateSelectorButton, { input: '', setInput: jest.fn() }));
    await waitFor(() => expect(getPromptTemplates).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: '他のテンプレートを選択する' }));
    expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }));
    expect(screen.getByTestId('dialog')).toHaveAttribute('data-open', 'false');
  });
});
