/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) =>
    React.createElement('a', { href, ...props }, children),
}));

jest.mock('@/app/_components/ui/button', () => ({
  Button: ({ children, ...props }: any) => React.createElement('button', props, children),
}));

jest.mock('@/app/_components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => React.createElement('div', {}, children),
  DropdownMenuTrigger: ({ children }: any) => React.createElement(React.Fragment, {}, children),
  DropdownMenuContent: ({ children }: any) => React.createElement('div', {}, children),
  DropdownMenuItem: ({ children }: any) => React.createElement('div', {}, children),
}));

jest.mock('@/app/_components/icon/button/Ellipsis', () => ({
  __esModule: true,
  default: () => React.createElement('span', { 'data-testid': 'ellipsis' }),
}));

jest.mock('@/app/_components/icon/button/Delete', () => ({
  __esModule: true,
  default: () => React.createElement('span', { 'data-testid': 'delete' }),
}));

jest.mock('@/app/_utils/date', () => ({
  formatDate: () => '2024/01/01 00:00',
}));

import ThreadList from '@/app/_components/chat/thread-list';

describe('ThreadList', () => {
  test('N-01-001: スレッド一覧を表示し、削除クリックで deleteThread が呼ばれる', () => {
    const deleteThread = jest.fn();
    render(
      React.createElement(ThreadList, {
        threads: [
          { id: 't1', title: 'title1', updatedAt: new Date().toISOString(), userId: 'u1' },
        ] as any,
        deleteThread,
      })
    );

    expect(screen.getByText('title1')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/chat/t1');

    fireEvent.click(screen.getByText('削除'));
    expect(deleteThread).toHaveBeenCalledWith('t1');
  });

  test('L-01-001: basePath を変更するとリンク先が変わる', () => {
    render(
      React.createElement(ThreadList, {
        threads: [
          { id: 't1', title: 'title1', updatedAt: new Date().toISOString(), userId: 'u1' },
        ] as any,
        basePath: '/rag',
        deleteThread: jest.fn(),
      })
    );

    expect(screen.getByRole('link')).toHaveAttribute('href', '/rag/t1');
  });

  test('L-02-001: threads が空の場合は何も表示しない', () => {
    render(
      React.createElement(ThreadList, {
        threads: [],
        deleteThread: jest.fn(),
      })
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByText('削除')).not.toBeInTheDocument();
  });

  test('L-03-001: updatedAt が nullish の場合でも日付表示が行われる', () => {
    render(
      React.createElement(ThreadList, {
        threads: [{ id: 't1', title: 'title1', userId: 'u1' } as any],
        deleteThread: jest.fn(),
      })
    );

    expect(screen.getByText('2024/01/01 00:00')).toBeInTheDocument();
  });

  test('L-04-001: 複数のスレッドを表示する', () => {
    render(
      React.createElement(ThreadList, {
        threads: [
          { id: 't1', title: 'title1', updatedAt: new Date().toISOString(), userId: 'u1' },
          { id: 't2', title: 'title2', updatedAt: new Date().toISOString(), userId: 'u2' },
          { id: 't3', title: 'title3', updatedAt: new Date().toISOString(), userId: 'u3' },
        ] as any,
        deleteThread: jest.fn(),
      })
    );

    expect(screen.getByText('title1')).toBeInTheDocument();
    expect(screen.getByText('title2')).toBeInTheDocument();
    expect(screen.getByText('title3')).toBeInTheDocument();
  });

  test('N-01-002: 複数のスレッドで各リンクが正しく生成される', () => {
    render(
      React.createElement(ThreadList, {
        threads: [
          { id: 't1', title: 'title1', updatedAt: new Date().toISOString(), userId: 'u1' },
          { id: 't2', title: 'title2', updatedAt: new Date().toISOString(), userId: 'u2' },
        ] as any,
        deleteThread: jest.fn(),
      })
    );

    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/chat/t1');
    expect(links[1]).toHaveAttribute('href', '/chat/t2');
  });

  test('L-05-001: 非常に長いタイトルのスレッドを表示できる', () => {
    const longTitle = 'a'.repeat(500);
    render(
      React.createElement(ThreadList, {
        threads: [
          { id: 't1', title: longTitle, updatedAt: new Date().toISOString(), userId: 'u1' } as any,
        ],
        deleteThread: jest.fn(),
      })
    );

    expect(screen.getByText(longTitle)).toBeInTheDocument();
  });

  test('N-01-003: className prop が正しく適用される', () => {
    const { container } = render(
      React.createElement(ThreadList, {
        threads: [
          { id: 't1', title: 'title1', updatedAt: new Date().toISOString(), userId: 'u1' } as any,
        ],
        deleteThread: jest.fn(),
        className: 'custom-class',
      })
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  test('L-06-001: threadId に特殊文字が含まれる場合のリンク生成', () => {
    render(
      React.createElement(ThreadList, {
        threads: [
          { id: 't-1/2@3', title: 'special', updatedAt: new Date().toISOString(), userId: 'u1' },
        ] as any,
        deleteThread: jest.fn(),
      })
    );

    expect(screen.getByRole('link')).toHaveAttribute('href', '/chat/t-1/2@3');
  });

  test('I-01-001: 複数のスレッドの削除ボタンがそれぞれ正しい id を渡す', () => {
    const deleteThread = jest.fn();
    render(
      React.createElement(ThreadList, {
        threads: [
          { id: 't1', title: 'title1', updatedAt: new Date().toISOString(), userId: 'u1' },
          { id: 't2', title: 'title2', updatedAt: new Date().toISOString(), userId: 'u2' },
          { id: 't3', title: 'title3', updatedAt: new Date().toISOString(), userId: 'u3' },
        ] as any,
        deleteThread,
      })
    );

    const deleteButtons = screen.getAllByText('削除');
    fireEvent.click(deleteButtons[0]);
    expect(deleteThread).toHaveBeenCalledWith('t1');

    fireEvent.click(deleteButtons[1]);
    expect(deleteThread).toHaveBeenCalledWith('t2');

    fireEvent.click(deleteButtons[2]);
    expect(deleteThread).toHaveBeenCalledWith('t3');
    expect(deleteThread).toHaveBeenCalledTimes(3);
  });
});
