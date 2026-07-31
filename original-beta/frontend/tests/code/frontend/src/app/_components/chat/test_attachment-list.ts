/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('@/app/_utils/file', () => ({
  formatFileSize: (n: number) => `${n}B`,
}));

jest.mock('@/app/_components/icon/button/TextFile', () => ({
  __esModule: true,
  default: () => React.createElement('span', { 'data-testid': 'text-file-icon' }),
}));

jest.mock('@/app/_components/icon/button/Close', () => ({
  __esModule: true,
  default: () => React.createElement('span', { 'data-testid': 'close-icon' }),
}));

jest.mock('@/app/_components/ui/button', () => ({
  Button: ({ children, ...props }: any) => React.createElement('button', props, children),
}));

import AttachmentList from '@/app/_components/chat/attachment-list';

describe('AttachmentList', () => {
  const createFile = (name: string, type: string, size: number) =>
    new File([new Uint8Array(size)], name, { type });

  test('N-01-001: 画像ファイルはプレビューimgを表示する', () => {
    const files: any = [
      {
        file: createFile('a.png', 'image/png', 10),
        url: 'blob:a',
      },
    ];

    render(React.createElement(AttachmentList, { files, handleDelete: jest.fn() }));

    const img = screen.getByRole('img', { name: 'チャット添付画像(a.png)' });
    expect(img).toHaveAttribute('src', 'blob:a');
    expect(screen.queryByTestId('text-file-icon')).not.toBeInTheDocument();
    expect(screen.getByText('10B')).toBeInTheDocument();
  });

  test('N-01-002: 非画像ファイルはテキストアイコンを表示する', () => {
    const files: any = [
      {
        file: createFile('b.txt', 'text/plain', 20),
        url: 'blob:b',
      },
    ];

    render(React.createElement(AttachmentList, { files, handleDelete: jest.fn() }));
    expect(screen.getByTestId('text-file-icon')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /チャット添付画像/ })).not.toBeInTheDocument();
    expect(screen.getByText('b.txt')).toBeInTheDocument();
    expect(screen.getByText('20B')).toBeInTheDocument();
  });

  test('I-01-001: 削除ボタン押下で handleDelete が呼ばれる', () => {
    const handleDelete = jest.fn();
    const files: any = [
      {
        file: createFile('c.txt', 'text/plain', 1),
        url: 'blob:c',
      },
    ];

    render(React.createElement(AttachmentList, { files, handleDelete }));

    fireEvent.click(screen.getByRole('button'));
    expect(handleDelete).toHaveBeenCalledTimes(1);
  });
});
