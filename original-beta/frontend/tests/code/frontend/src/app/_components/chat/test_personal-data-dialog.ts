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

import PersonalDataDialog from '@/app/_components/chat/personal-data-dialog';

describe('PersonalDataDialog', () => {
  test('N-01-001: PII リストを表示する', () => {
    render(
      React.createElement(PersonalDataDialog, {
        isOpen: true,
        onClose: jest.fn(),
        onConfirm: jest.fn(),
        piiList: [
          { category: 'メール', text: 'a@example.com' },
          { category: '氏名', text: '山田太郎' },
        ],
      })
    );

    expect(screen.getByText('個人情報を検出しました')).toBeInTheDocument();
    expect(screen.getByText('メール：a@example.com')).toBeInTheDocument();
    expect(screen.getByText('氏名：山田太郎')).toBeInTheDocument();
  });

  test('I-01-001: キャンセル/送信するで各コールバックが呼ばれる', () => {
    const onClose = jest.fn();
    const onConfirm = jest.fn();

    render(
      React.createElement(PersonalDataDialog, {
        isOpen: true,
        onClose,
        onConfirm,
        piiList: [],
      })
    );

    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }));
    fireEvent.click(screen.getByRole('button', { name: '送信する' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
