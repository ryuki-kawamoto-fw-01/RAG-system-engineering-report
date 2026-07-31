/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/app/_components/chat/assistant-avatar', () => ({
  __esModule: true,
  default: () => React.createElement('div', { 'data-testid': 'assistant-avatar' }),
}));

jest.mock('@/app/_components/ui/skeleton', () => ({
  Skeleton: ({ className }: any) =>
    React.createElement('div', { 'data-testid': 'skeleton', className }),
}));

import AssistantMessageSkeleton from '@/app/_components/chat/assistant-message-skeleton';

describe('AssistantMessageSkeleton', () => {
  test('N-01-001: アバターとスケルトン3本を描画する', () => {
    render(React.createElement(AssistantMessageSkeleton));
    expect(screen.getByTestId('assistant-avatar')).toBeInTheDocument();
    expect(screen.getAllByTestId('skeleton')).toHaveLength(3);
  });
});
