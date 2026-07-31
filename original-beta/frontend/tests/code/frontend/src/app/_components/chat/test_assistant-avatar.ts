/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/app/_components/ui/avatar', () => ({
  Avatar: ({ children, className }: any) =>
    React.createElement('div', { 'data-testid': 'avatar', className }, children),
  AvatarImage: ({ src, alt }: any) => React.createElement('img', { src, alt }),
  AvatarFallback: ({ children }: any) =>
    React.createElement('span', { 'data-testid': 'fallback' }, children),
}));

import AssistantAvatar from '@/app/_components/chat/assistant-avatar';

describe('AssistantAvatar', () => {
  test('N-01-001: 画像とフォールバック(先頭文字)を表示する', () => {
    render(React.createElement(AssistantAvatar));

    expect(screen.getByRole('img', { name: 'アシスタントアイコン' })).toHaveAttribute(
      'src',
      '/images/assistant.png'
    );
    // config.ts の assistantName は「製造業向けアシスタントAI」なので先頭は「製」
    expect(screen.getByTestId('fallback')).toHaveTextContent('製');
  });

  test('L-01-001: className が追加される', () => {
    render(React.createElement(AssistantAvatar, { className: 'x' }));
    expect(screen.getByTestId('avatar')).toHaveClass('x');
  });
});
