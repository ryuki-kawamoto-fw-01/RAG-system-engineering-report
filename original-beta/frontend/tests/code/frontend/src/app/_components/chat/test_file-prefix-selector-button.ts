/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('@/app/(dashboard)/agent/[task]/[id]/_actions/getFolders', () => ({
  getFolders: jest.fn(),
}));

jest.mock('@/app/_components/ui/select', () => ({
  Select: ({ children }: any) => React.createElement('div', {}, children),
  SelectTrigger: ({ children }: any) => React.createElement('div', {}, children),
  SelectValue: ({ placeholder }: any) => React.createElement('div', {}, placeholder),
}));

jest.mock('@/app/_components/ui/spinner', () => ({
  Spinner: () => React.createElement('div', { 'data-testid': 'spinner' }),
}));

jest.mock('@/app/_components/ui/button', () => ({
  Button: ({ children, ...props }: any) => React.createElement('button', props, children),
}));

jest.mock('@/app/_components/ui/command', () => ({
  Command: ({ children }: any) => React.createElement('div', {}, children),
  CommandInput: (props: any) => React.createElement('input', props),
  CommandEmpty: ({ children }: any) => React.createElement('div', {}, children),
  CommandList: ({ children }: any) => React.createElement('div', {}, children),
  CommandGroup: ({ children, heading }: any) => React.createElement('div', {}, heading, children),
  CommandItem: ({ children, onSelect, ...props }: any) =>
    React.createElement(
      'button',
      { type: 'button', onClick: () => onSelect?.(), ...props },
      children
    ),
}));

jest.mock('@/app/_components/ui/popover', () => ({
  Popover: ({ children, open, onOpenChange }: any) =>
    React.createElement(
      'div',
      { 'data-testid': 'popover', 'data-open': String(open) },
      React.createElement(
        'button',
        { type: 'button', onClick: () => onOpenChange?.(!open) },
        '__toggle__'
      ),
      children
    ),
  PopoverTrigger: ({ children }: any) => React.createElement(React.Fragment, {}, children),
  PopoverContent: ({ children }: any) => React.createElement('div', {}, children),
}));

jest.mock('lucide-react', () => ({
  Folder: () => React.createElement('span', { 'data-testid': 'folder-icon' }),
  ChevronRight: () => React.createElement('span', { 'data-testid': 'chevron-icon' }),
}));

import { getFolders } from '@/app/(dashboard)/agent/[task]/[id]/_actions/getFolders';
import FilePrefixSelectorButton from '@/app/_components/chat/file-prefix-selector-button';

describe('FilePrefixSelectorButton', () => {
  beforeEach(() => {
    (getFolders as jest.Mock).mockReset();
  });

  test('N-01-001: open 時にフォルダ取得し、選択で onFilePrefixChange を呼ぶ', async () => {
    (getFolders as jest.Mock).mockResolvedValue({
      success: true,
      folders: [
        { name: 'A', path: 'A' },
        { name: 'B', path: 'B' },
        { name: 'A1', path: 'A/A1' },
      ],
    });

    const onFilePrefixChange = jest.fn();
    render(
      React.createElement(FilePrefixSelectorButton, {
        containerName: 'c',
        onFilePrefixChange,
      })
    );

    // popover open
    fireEvent.click(screen.getByRole('button', { name: '__toggle__' }));

    await waitFor(() => {
      expect(getFolders).toHaveBeenCalledWith('c');
    });

    // ルートには A と B が出る
    fireEvent.click(screen.getByRole('button', { name: 'A' }));
    expect(onFilePrefixChange).toHaveBeenCalledWith('A');

    // ボタン文言も更新される（SelectValue の placeholder をモック表示）
    expect(screen.getByText('「A」フォルダ内を検索')).toBeInTheDocument();
  });

  test('E-01-001: フォルダ取得失敗時にエラーメッセージをセットする', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (getFolders as jest.Mock).mockRejectedValue(new Error('network error'));

    const onFilePrefixChange = jest.fn();
    render(
      React.createElement(FilePrefixSelectorButton, {
        containerName: 'c',
        onFilePrefixChange,
      })
    );

    fireEvent.click(screen.getByRole('button', { name: '__toggle__' }));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading folders:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  test('N-02-001: 「フォルダ選択を解除」で null が渡される', async () => {
    (getFolders as jest.Mock).mockResolvedValue({
      success: true,
      folders: [{ name: 'A', path: 'A' }],
    });

    const onFilePrefixChange = jest.fn();
    render(
      React.createElement(FilePrefixSelectorButton, {
        containerName: 'c',
        onFilePrefixChange,
      })
    );

    fireEvent.click(screen.getByRole('button', { name: '__toggle__' }));

    await waitFor(() => {
      expect(getFolders).toHaveBeenCalledWith('c');
    });

    fireEvent.click(screen.getByRole('button', { name: 'フォルダ選択を解除' }));
    expect(onFilePrefixChange).toHaveBeenCalledWith(null);
  });

  test('N-03-001: 下の階層へ移動→1つ上の階層へで戻れる（移動は選択ではない）', async () => {
    (getFolders as jest.Mock).mockResolvedValue({
      success: true,
      folders: [
        { name: 'A', path: 'A' },
        { name: 'A1', path: 'A/A1' },
      ],
    });

    const onFilePrefixChange = jest.fn();
    render(
      React.createElement(FilePrefixSelectorButton, {
        containerName: 'c',
        onFilePrefixChange,
      })
    );

    fireEvent.click(screen.getByRole('button', { name: '__toggle__' }));

    await waitFor(() => {
      expect(getFolders).toHaveBeenCalledWith('c');
    });

    fireEvent.click(screen.getByRole('button', { name: '下の階層へ' }));
    expect(onFilePrefixChange).not.toHaveBeenCalled();

    // 子フォルダが見える
    expect(await screen.findByRole('button', { name: 'A1' })).toBeInTheDocument();

    // 1つ上へ戻る
    fireEvent.click(screen.getByRole('button', { name: /1つ上の階層へ/ }));
    expect(await screen.findByRole('button', { name: 'A' })).toBeInTheDocument();
  });

  test('E-01-001: 取得失敗時はエラーメッセージを表示する', async () => {
    (getFolders as jest.Mock).mockResolvedValue({
      success: false,
      error: 'err',
      folders: [],
    });

    render(
      React.createElement(FilePrefixSelectorButton, {
        containerName: 'c',
        onFilePrefixChange: jest.fn(),
      })
    );

    fireEvent.click(screen.getByRole('button', { name: '__toggle__' }));

    await waitFor(() => {
      expect(screen.getByText('err')).toBeInTheDocument();
    });
  });

  test('E-03-001: success=false かつ error 未指定の場合はデフォルト文言を表示する', async () => {
    (getFolders as jest.Mock).mockResolvedValue({
      success: false,
      folders: [],
    });

    render(
      React.createElement(FilePrefixSelectorButton, {
        containerName: 'c',
        onFilePrefixChange: jest.fn(),
      })
    );

    fireEvent.click(screen.getByRole('button', { name: '__toggle__' }));

    await waitFor(() => {
      expect(screen.getByText('フォルダ情報の取得に失敗しました')).toBeInTheDocument();
    });
  });

  test('E-02-001: 取得中に例外が発生した場合もエラーメッセージを表示する', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (getFolders as jest.Mock).mockRejectedValue(new Error('boom'));

    render(
      React.createElement(FilePrefixSelectorButton, {
        containerName: 'c',
        onFilePrefixChange: jest.fn(),
      })
    );

    fireEvent.click(screen.getByRole('button', { name: '__toggle__' }));

    await waitFor(() => {
      expect(screen.getByText('フォルダ情報の取得中にエラーが発生しました')).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  test('L-01-001: フォルダ0件でもクラッシュせず、選択肢が出ない', async () => {
    (getFolders as jest.Mock).mockResolvedValue({
      success: true,
      folders: [],
    });

    render(
      React.createElement(FilePrefixSelectorButton, {
        containerName: 'c',
        onFilePrefixChange: jest.fn(),
      })
    );

    fireEvent.click(screen.getByRole('button', { name: '__toggle__' }));

    await waitFor(() => {
      expect(getFolders).toHaveBeenCalledWith('c');
    });

    expect(screen.queryByRole('button', { name: 'A' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'B' })).not.toBeInTheDocument();
  });

  test('L-02-001: 非常に多数のフォルダがある場合も正しく表示される', async () => {
    const manyFolders = Array.from({ length: 100 }, (_, i) => ({
      name: `Folder${i}`,
      path: `Folder${i}`,
    }));

    (getFolders as jest.Mock).mockResolvedValue({
      success: true,
      folders: manyFolders,
    });

    render(
      React.createElement(FilePrefixSelectorButton, {
        containerName: 'c',
        onFilePrefixChange: jest.fn(),
      })
    );

    fireEvent.click(screen.getByRole('button', { name: '__toggle__' }));

    await waitFor(() => {
      expect(getFolders).toHaveBeenCalledWith('c');
    });

    expect(screen.getByRole('button', { name: 'Folder0' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Folder99' })).toBeInTheDocument();
  });

  test('L-03-001: 非常に深い階層のフォルダ構造を正しく処理する', async () => {
    (getFolders as jest.Mock).mockResolvedValue({
      success: true,
      folders: [
        { name: 'A', path: 'A' },
        { name: 'B', path: 'A/B' },
        { name: 'C', path: 'A/B/C' },
        { name: 'D', path: 'A/B/C/D' },
        { name: 'E', path: 'A/B/C/D/E' },
        { name: 'F', path: 'A/B/C/D/E/F' },
      ],
    });

    const onFilePrefixChange = jest.fn();
    render(
      React.createElement(FilePrefixSelectorButton, {
        containerName: 'c',
        onFilePrefixChange,
      })
    );

    fireEvent.click(screen.getByRole('button', { name: '__toggle__' }));

    await waitFor(() => {
      expect(getFolders).toHaveBeenCalledWith('c');
    });

    // ルートにAが表示される
    expect(screen.getByRole('button', { name: 'A' })).toBeInTheDocument();

    // 選択すると深い階層のパスが設定される
    fireEvent.click(screen.getByRole('button', { name: 'A' }));
    expect(onFilePrefixChange).toHaveBeenCalledWith('A');
  });

  test('L-04-001: 非常に長いフォルダ名を持つフォルダを正しく表示する', async () => {
    const longName = 'a'.repeat(500);
    (getFolders as jest.Mock).mockResolvedValue({
      success: true,
      folders: [{ name: longName, path: longName }],
    });

    const onFilePrefixChange = jest.fn();
    render(
      React.createElement(FilePrefixSelectorButton, {
        containerName: 'c',
        onFilePrefixChange,
      })
    );

    fireEvent.click(screen.getByRole('button', { name: '__toggle__' }));

    await waitFor(() => {
      expect(getFolders).toHaveBeenCalledWith('c');
    });

    expect(screen.getByRole('button', { name: longName })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: longName }));
    expect(onFilePrefixChange).toHaveBeenCalledWith(longName);
  });

  test('N-04-001: 複数の階層移動を繰り返しても正しく動作する', async () => {
    (getFolders as jest.Mock).mockResolvedValue({
      success: true,
      folders: [
        { name: 'A', path: 'A' },
        { name: 'A1', path: 'A/A1' },
        { name: 'A2', path: 'A/A2' },
        { name: 'B', path: 'B' },
      ],
    });

    render(
      React.createElement(FilePrefixSelectorButton, {
        containerName: 'c',
        onFilePrefixChange: jest.fn(),
      })
    );

    fireEvent.click(screen.getByRole('button', { name: '__toggle__' }));

    await waitFor(() => {
      expect(getFolders).toHaveBeenCalledWith('c');
    });

    // A → 下の階層へ → A1が見える
    fireEvent.click(screen.getByRole('button', { name: '下の階層へ' }));
    expect(await screen.findByRole('button', { name: 'A1' })).toBeInTheDocument();

    // 1つ上へ → A とB が見える
    fireEvent.click(screen.getByRole('button', { name: /1つ上の階層へ/ }));
    expect(await screen.findByRole('button', { name: 'A' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'B' })).toBeInTheDocument();

    // もう一度 A → 下の階層へ → A2 も見える
    fireEvent.click(screen.getByRole('button', { name: '下の階層へ' }));
    expect(await screen.findByRole('button', { name: 'A1' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'A2' })).toBeInTheDocument();
  });

  test('I-01-001: フォルダ選択→別フォルダ選択→解除の一連の流れ', async () => {
    (getFolders as jest.Mock).mockResolvedValue({
      success: true,
      folders: [
        { name: 'A', path: 'A' },
        { name: 'B', path: 'B' },
      ],
    });

    const onFilePrefixChange = jest.fn();
    render(
      React.createElement(FilePrefixSelectorButton, {
        containerName: 'c',
        onFilePrefixChange,
      })
    );

    fireEvent.click(screen.getByRole('button', { name: '__toggle__' }));

    await waitFor(() => {
      expect(getFolders).toHaveBeenCalledWith('c');
    });

    // Aを選択
    fireEvent.click(screen.getByRole('button', { name: 'A' }));
    expect(onFilePrefixChange).toHaveBeenCalledWith('A');
    expect(screen.getByText('「A」フォルダ内を検索')).toBeInTheDocument();

    // ポップオーバーを再度開く
    fireEvent.click(screen.getByRole('button', { name: '__toggle__' }));

    // Bを選択
    fireEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(onFilePrefixChange).toHaveBeenCalledWith('B');
    expect(screen.getByText('「B」フォルダ内を検索')).toBeInTheDocument();

    // ポップオーバーを再度開く
    fireEvent.click(screen.getByRole('button', { name: '__toggle__' }));

    // 選択解除
    fireEvent.click(screen.getByRole('button', { name: 'フォルダ選択を解除' }));
    expect(onFilePrefixChange).toHaveBeenCalledWith(null);
    expect(onFilePrefixChange).toHaveBeenCalledTimes(3);
  });

  test('L-05-001: 同じ名前だが異なるパスを持つフォルダが複数ある場合', async () => {
    (getFolders as jest.Mock).mockResolvedValue({
      success: true,
      folders: [
        { name: 'A', path: 'A' },
        { name: 'B', path: 'B' },
        { name: 'A', path: 'B/A' },
      ],
    });

    const onFilePrefixChange = jest.fn();
    render(
      React.createElement(FilePrefixSelectorButton, {
        containerName: 'c',
        onFilePrefixChange,
      })
    );

    fireEvent.click(screen.getByRole('button', { name: '__toggle__' }));

    await waitFor(() => {
      expect(getFolders).toHaveBeenCalledWith('c');
    });

    // ルート階層で A と B が表示される
    const rootFolders = screen.getAllByRole('button', { name: 'A' });
    expect(rootFolders.length).toBeGreaterThanOrEqual(1);

    // 最初の A を選択
    fireEvent.click(rootFolders[0]);
    expect(onFilePrefixChange).toHaveBeenCalledWith('A');
  });
});
