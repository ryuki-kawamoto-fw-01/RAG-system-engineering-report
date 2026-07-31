/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('@/app/_components/ui/card', () => ({
  Card: ({ children, onClick }: any) =>
    React.createElement('div', { role: 'button', onClick }, children),
  CardHeader: ({ children }: any) => React.createElement('div', {}, children),
  CardTitle: ({ children }: any) => React.createElement('div', {}, children),
  CardContent: ({ children }: any) => React.createElement('div', {}, children),
  CardDescription: ({ children }: any) => React.createElement('div', {}, children),
}));

jest.mock('@/app/_components/icon/decorative/Pencil', () => ({
  __esModule: true,
  default: () => React.createElement('span', { 'data-testid': 'icon-pencil' }),
}));

jest.mock('@/app/_components/icon/decorative/Document', () => ({
  __esModule: true,
  default: () => React.createElement('span', { 'data-testid': 'icon-default' }),
}));

jest.mock('@/app/_components/icon/decorative/Bulb', () => ({
  __esModule: true,
  default: () => React.createElement('span', { 'data-testid': 'icon-bulb' }),
}));

jest.mock('@/app/_components/icon/decorative/Graph', () => ({
  __esModule: true,
  default: () => React.createElement('span', { 'data-testid': 'icon-graph' }),
}));

jest.mock('@/app/_components/icon/decorative/Caution', () => ({
  __esModule: true,
  default: () => React.createElement('span', { 'data-testid': 'icon-caution' }),
}));

jest.mock('@/app/_components/icon/decorative/Scale', () => ({
  __esModule: true,
  default: () => React.createElement('span', { 'data-testid': 'icon-scale' }),
}));

jest.mock('@/app/_components/icon/decorative/Code', () => ({
  __esModule: true,
  default: () => React.createElement('span', { 'data-testid': 'icon-code' }),
}));

import ChatTemplates from '@/app/_components/chat/chat-templates';

describe('ChatTemplates', () => {
  test('N-01-001: テンプレートを表示してクリックで handleTextUpdate が呼ばれる', () => {
    const handleTextUpdate = jest.fn();
    render(
      React.createElement(ChatTemplates, {
        templates: [
          {
            id: 't1',
            title: 'T',
            description: 'D',
            content: 'C',
            category: 'x',
            icon: 'pencil',
          } as any,
        ],
        handleTextUpdate,
      })
    );

    expect(screen.getByTestId('icon-pencil')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(handleTextUpdate).toHaveBeenCalledWith('C', 't1');
  });

  test('L-01-001: icon 未指定はデフォルトアイコンになる', () => {
    render(
      React.createElement(ChatTemplates, {
        templates: [
          { id: 't2', title: 'T2', description: 'D2', content: 'C2', category: 'x' } as any,
        ],
        handleTextUpdate: jest.fn(),
      })
    );

    expect(screen.getByTestId('icon-default')).toBeInTheDocument();
  });

  test('N-01-002: icon の各分岐（bulb/graph/code/caution/scale）を表示できる', () => {
    render(
      React.createElement(ChatTemplates, {
        templates: [
          { id: 'b', title: 'b', description: '', content: '', category: 'x', icon: 'bulb' } as any,
          {
            id: 'g',
            title: 'g',
            description: '',
            content: '',
            category: 'x',
            icon: 'graph',
          } as any,
          { id: 'c', title: 'c', description: '', content: '', category: 'x', icon: 'code' } as any,
          {
            id: 'ca',
            title: 'ca',
            description: '',
            content: '',
            category: 'x',
            icon: 'caution',
          } as any,
          {
            id: 's',
            title: 's',
            description: '',
            content: '',
            category: 'x',
            icon: 'scale',
          } as any,
        ],
        handleTextUpdate: jest.fn(),
      })
    );

    expect(screen.getByTestId('icon-bulb')).toBeInTheDocument();
    expect(screen.getByTestId('icon-graph')).toBeInTheDocument();
    expect(screen.getByTestId('icon-code')).toBeInTheDocument();
    expect(screen.getByTestId('icon-caution')).toBeInTheDocument();
    expect(screen.getByTestId('icon-scale')).toBeInTheDocument();
  });

  test('L-01-002: templates が空配列の場合は何も表示しない', () => {
    render(
      React.createElement(ChatTemplates, {
        templates: [],
        handleTextUpdate: jest.fn(),
      })
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('L-01-003: templates が多数ある場合でも正常に表示される', () => {
    const manyTemplates = Array.from({ length: 10 }, (_, i) => ({
      id: `t${i + 1}`,
      title: `タイトル${i + 1}`,
      description: `説明${i + 1}`,
      content: `内容${i + 1}`,
      category: 'x',
    })) as any[];

    render(
      React.createElement(ChatTemplates, {
        templates: manyTemplates,
        handleTextUpdate: jest.fn(),
      })
    );

    expect(screen.getByText('タイトル1')).toBeInTheDocument();
    expect(screen.getByText('タイトル10')).toBeInTheDocument();
  });

  test('L-01-004: すべてのテンプレートが同じアイコンでも正常に表示される', () => {
    const templates = [
      { id: 't1', title: 'T1', description: 'D1', content: 'C1', category: 'x', icon: 'bulb' },
      { id: 't2', title: 'T2', description: 'D2', content: 'C2', category: 'x', icon: 'bulb' },
      { id: 't3', title: 'T3', description: 'D3', content: 'C3', category: 'x', icon: 'bulb' },
    ] as any[];

    render(
      React.createElement(ChatTemplates, {
        templates,
        handleTextUpdate: jest.fn(),
      })
    );

    const bulbIcons = screen.getAllByTestId('icon-bulb');
    expect(bulbIcons).toHaveLength(3);
  });

  test('N-01-003: className が正しく適用される', () => {
    const { container } = render(
      React.createElement(ChatTemplates, {
        templates: [
          { id: 't1', title: 'T1', description: 'D1', content: 'C1', category: 'x' } as any,
        ],
        handleTextUpdate: jest.fn(),
        className: 'custom-class',
      })
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('custom-class');
  });

  test('L-01-006: 未知のアイコン名が渡された場合はデフォルトアイコンを表示する', () => {
    render(
      React.createElement(ChatTemplates, {
        templates: [
          {
            id: 't1',
            title: 'T1',
            description: 'D1',
            content: 'C1',
            category: 'x',
            icon: 'unknown',
          } as any,
        ],
        handleTextUpdate: jest.fn(),
      })
    );

    expect(screen.getByTestId('icon-default')).toBeInTheDocument();
  });

  test('I-01-001: 複数テンプレートのクリックでそれぞれ正しい引数が渡される', () => {
    const handleTextUpdate = jest.fn();
    const templates = [
      { id: 't1', title: 'Template1', description: 'D1', content: 'Content1', category: 'x' },
      { id: 't2', title: 'Template2', description: 'D2', content: 'Content2', category: 'x' },
    ] as any[];

    render(
      React.createElement(ChatTemplates, {
        templates,
        handleTextUpdate,
      })
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(handleTextUpdate).toHaveBeenCalledWith('Content1', 't1');

    fireEvent.click(buttons[1]);
    expect(handleTextUpdate).toHaveBeenCalledWith('Content2', 't2');

    expect(handleTextUpdate).toHaveBeenCalledTimes(2);
  });
});
