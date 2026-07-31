/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';

function renderPageWithPageLayout(
  impl: (props: { children: React.ReactNode; className?: string }) => any
) {
  let Page: any;
  jest.isolateModules(() => {
    jest.doMock('@/app/_components/layout/page-layout', () => ({
      __esModule: true,
      default: impl,
    }));

    Page = require('@/app/(dashboard)/chat/page').default;
  });

  return render(React.createElement(Page));
}

describe('chat Page', () => {
  test('N-01-001: PageLayout に p-5 が渡される', () => {
    renderPageWithPageLayout(({ children, className }) =>
      React.createElement('div', { 'data-testid': 'page-layout', className }, children)
    );

    expect(screen.getByTestId('page-layout')).toHaveClass('p-5');
  });

  test('I-01-001: PageLayout 配下に中央寄せ用コンテナが描画される', () => {
    renderPageWithPageLayout(({ children, className }) =>
      React.createElement('div', { 'data-testid': 'page-layout', className }, children)
    );

    expect(screen.getByTestId('page-layout').firstChild).toHaveClass(
      'flex',
      'h-full',
      'items-center',
      'justify-center'
    );
  });

  test('L-01-001: 中央寄せコンテナはテキストを持たない（コメントのみ）', () => {
    renderPageWithPageLayout(({ children, className }) =>
      React.createElement('div', { 'data-testid': 'page-layout', className }, children)
    );

    expect(screen.getByTestId('page-layout').textContent).toBe('');
  });

  test('E-01-001: PageLayout が例外を投げる場合は Page の描画も失敗する', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() =>
      renderPageWithPageLayout(() => {
        throw new Error('boom');
      })
    ).toThrow('boom');

    consoleErrorSpy.mockRestore();
  });
});
