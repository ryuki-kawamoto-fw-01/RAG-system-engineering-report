/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('@/app/_components/ui/button', () => ({
  Button: ({ children, ...props }: any) => React.createElement('button', props, children),
}));

jest.mock('@/app/_components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) =>
    React.createElement('div', { 'data-testid': 'dialog', 'data-open': String(open) }, children),
  DialogContent: ({ children }: any) => React.createElement('div', {}, children),
  DialogFooter: ({ children }: any) => React.createElement('div', {}, children),
  DialogHeader: ({ children }: any) => React.createElement('div', {}, children),
  DialogTitle: ({ children }: any) => React.createElement('h2', {}, children),
}));

import BanDialog from '@/app/_components/chat/ban-dialog';

describe('BanDialog', () => {
  test('N-01-001: 禁止ワード一覧を表示する', () => {
    render(
      React.createElement(BanDialog, {
        isOpen: true,
        onClose: jest.fn(),
        banWords: ['A', 'B'],
      })
    );

    expect(screen.getByText('禁止ワードを検出しました')).toBeInTheDocument();
    expect(screen.getByText('禁止ワード：A、B')).toBeInTheDocument();
  });

  test('I-01-001: 閉じるボタンで onClose が呼ばれる', () => {
    const onClose = jest.fn();
    render(React.createElement(BanDialog, { isOpen: true, onClose, banWords: [] }));
    fireEvent.click(screen.getByRole('button', { name: '閉じる' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
