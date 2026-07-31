import React from 'react';

import { TEMPLATE_PAGE_TYPE } from '@/app/_constants/prompt-template';

jest.mock('server-only', () => ({}), { virtual: true });

const getChatThreadMock = jest.fn();
const getPromptTemplatesMock = jest.fn();
const getBanWordsMock = jest.fn();

function loadPage() {
  let Page: any;

  jest.isolateModules(() => {
    jest.doMock('@/app/(dashboard)/chat/[id]/_actions/getChatThread', () => ({
      getChatThread: (...args: any[]) => getChatThreadMock(...args),
    }));

    jest.doMock('@/app/(dashboard)/chat/[id]/_actions/getPromptTemplates', () => ({
      getPromptTemplates: (...args: any[]) => getPromptTemplatesMock(...args),
    }));

    jest.doMock('@/app/(dashboard)/chat/_actions/getBanWord', () => ({
      getBanWords: (...args: any[]) => getBanWordsMock(...args),
    }));

    jest.doMock('@/app/_components/layout/page-layout', () => ({
      __esModule: true,
      default: (props: any) => React.createElement('div', props),
    }));

    jest.doMock('@/app/(dashboard)/chat/[id]/_components/chat', () => ({
      __esModule: true,
      default: (props: any) => React.createElement('div', props),
    }));

    Page = require('@/app/(dashboard)/chat/[id]/page').default;
  });

  return Page;
}

describe('chat/[id] Page', () => {
  beforeEach(() => {
    getChatThreadMock.mockReset();
    getPromptTemplatesMock.mockReset();
    getBanWordsMock.mockReset();
  });

  test('N-01-001: messages が1件以上なら getPromptTemplates は呼ばれず templates は空配列', async () => {
    getChatThreadMock.mockResolvedValue({ id: 't1', messages: [{ id: 'm1' }] });
    getPromptTemplatesMock.mockResolvedValue([{ id: 'tpl-1' }]);
    getBanWordsMock.mockResolvedValue({ banWords: ['ng1'] });

    const Page = loadPage();
    const element = await Page({ params: { id: 't1' } });

    expect(getPromptTemplatesMock).not.toHaveBeenCalled();
    const chatThreadEl = (element as any).props.children;
    expect(chatThreadEl.props.templates).toEqual([]);
  });

  test('N-01-002: messages が0件なら getPromptTemplates が呼ばれ templates に反映される', async () => {
    getChatThreadMock.mockResolvedValue({ id: 't-empty', messages: [] });
    getPromptTemplatesMock.mockResolvedValue([{ id: 'tpl-1' }, { id: 'tpl-2' }]);
    getBanWordsMock.mockResolvedValue({ banWords: [] });

    const Page = loadPage();
    const element = await Page({ params: { id: 't-empty' } });

    expect(getPromptTemplatesMock).toHaveBeenCalledWith(TEMPLATE_PAGE_TYPE.CHAT);
    const chatThreadEl = (element as any).props.children;
    expect(chatThreadEl.props.templates).toEqual([{ id: 'tpl-1' }, { id: 'tpl-2' }]);
  });

  test('L-01-001: messages が0件かつテンプレートが0件でも templates は空配列のまま', async () => {
    getChatThreadMock.mockResolvedValue({ id: 't-empty', messages: [] });
    getPromptTemplatesMock.mockResolvedValue([]);
    getBanWordsMock.mockResolvedValue({ banWords: [] });

    const Page = loadPage();
    const element = await Page({ params: { id: 't-empty' } });

    expect(getPromptTemplatesMock).toHaveBeenCalledWith(TEMPLATE_PAGE_TYPE.CHAT);
    const chatThreadEl = (element as any).props.children;
    expect(chatThreadEl.props.templates).toEqual([]);
  });

  test('I-01-001: getBanWords の結果が banWords として ChatThread に渡される', async () => {
    getChatThreadMock.mockResolvedValue({ id: 't1', messages: [] });
    getPromptTemplatesMock.mockResolvedValue([]);
    getBanWordsMock.mockResolvedValue({ banWords: ['b1', 'b2'] });

    const Page = loadPage();
    const element = await Page({ params: { id: 't1' } });

    const chatThreadEl = (element as any).props.children;
    expect(chatThreadEl.props.banWords).toEqual(['b1', 'b2']);
  });

  test('I-01-002: thread の id/messages が ChatThread の id/threadId/initialMessages に連携される', async () => {
    const messages = [{ id: 'm1' }, { id: 'm2' }];
    getChatThreadMock.mockResolvedValue({ id: 'thread-x', messages });
    getPromptTemplatesMock.mockResolvedValue([]);
    getBanWordsMock.mockResolvedValue({ banWords: [] });

    const Page = loadPage();
    const element = await Page({ params: { id: 'thread-x' } });

    const chatThreadEl = (element as any).props.children;
    expect(chatThreadEl.props.id).toBe('thread-x');
    expect(chatThreadEl.props.threadId).toBe('thread-x');
    expect(chatThreadEl.props.initialMessages).toEqual(messages);
  });

  test('E-01-001: getChatThread が例外を投げた場合は Page も失敗する', async () => {
    getChatThreadMock.mockRejectedValue(new Error('boom'));

    const Page = loadPage();
    await expect(Page({ params: { id: 't1' } })).rejects.toThrow('boom');
  });

  test('E-01-002: getBanWords が例外を投げた場合は Page も失敗する', async () => {
    getChatThreadMock.mockResolvedValue({ id: 't1', messages: [] });
    getPromptTemplatesMock.mockResolvedValue([]);
    getBanWordsMock.mockRejectedValue(new Error('boom'));

    const Page = loadPage();
    await expect(Page({ params: { id: 't1' } })).rejects.toThrow('boom');
  });
});
