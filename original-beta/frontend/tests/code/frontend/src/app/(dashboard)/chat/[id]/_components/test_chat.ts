/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: any) => React.createElement('div', {}, children),
}));

const refreshMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock('@/app/_utils/message', () => ({
  getMessage: (code: string) => code,
}));

let selectedModel: any = 'gpt-5.2';
const dispatchMock = jest.fn();

jest.mock('@/app/_store/hooks', () => ({
  useAppSelector: (selector: any) => selector({ model: { chat_selectedModel: selectedModel } }),
  useAppDispatch: () => dispatchMock,
}));

jest.mock('@/app/_store/slice/model', () => ({
  setChatSelectedModel: (v: string) => ({ type: 'setChatSelectedModel', payload: v }),
}));

jest.mock('ai/react', () => {
  const React = require('react');
  return {
    useChat: ({ initialMessages }: any) => {
      const [input, setInput] = React.useState('');
      const [messages] = React.useState(initialMessages ?? []);
      const handleInputChange = (e: any) => setInput(e.target.value);
      return {
        messages,
        input,
        handleInputChange,
        setInput,
      };
    },
  };
});

jest.mock('@/app/_actions/sendChat', () => ({
  sendChat: jest.fn(),
}));

jest.mock('@/app/_actions/deleteFile', () => ({
  deleteFile: jest.fn(),
}));

jest.mock('@/app/_components/chat/chat-box', () => ({
  __esModule: true,
  default: ({ value, onChange, onPaste, isDisabled, handleFileClick, handleFileDelete }: any) =>
    React.createElement(
      'div',
      {},
      React.createElement('textarea', { 'aria-label': 'chat-input', value, onChange, onPaste }),
      React.createElement('button', { type: 'button', onClick: handleFileClick }, 'attach'),
      React.createElement('button', { type: 'button', onClick: handleFileDelete }, 'remove-file'),
      React.createElement('button', { type: 'submit', disabled: isDisabled }, '送信')
    ),
}));

jest.mock('@/app/_components/chat/chat-message-list', () => ({
  __esModule: true,
  default: ({ messages, recommend, onRecommendClick, isLoading }: any) =>
    React.createElement(
      'div',
      { 'data-testid': 'message-list', 'data-loading': String(!!isLoading) },
      messages.map((m: any) =>
        React.createElement(
          'div',
          { key: m.id, 'data-testid': `msg-${m.role}` },
          `${m.role}:${m.content}`
        )
      ),
      React.createElement('div', { 'data-testid': 'recommend' }, (recommend ?? []).join('|')),
      React.createElement(
        'button',
        { type: 'button', onClick: () => onRecommendClick?.('rec-text') },
        'recommend-send'
      )
    ),
}));

jest.mock('@/app/_components/chat/personal-data-dialog', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onConfirm, piiList }: any) =>
    React.createElement(
      'div',
      { 'data-testid': 'pii-dialog', 'data-open': String(!!isOpen) },
      React.createElement('div', { 'data-testid': 'pii-count' }, String(piiList?.length ?? 0)),
      React.createElement('button', { type: 'button', onClick: onClose }, 'pii-close'),
      React.createElement(
        'button',
        { type: 'button', onClick: () => void onConfirm?.() },
        'pii-confirm'
      )
    ),
}));

jest.mock('@/app/_components/ui/heading', () => ({
  __esModule: true,
  default: ({ children }: any) => React.createElement('div', {}, children),
}));

jest.mock('@/app/_components/ui/help', () => ({
  __esModule: true,
  default: () => React.createElement('span', {}),
}));

jest.mock('@/app/_components/chat/chat-templates', () => ({
  __esModule: true,
  default: ({ handleTextUpdate }: any) =>
    React.createElement(
      'button',
      { type: 'button', onClick: () => handleTextUpdate?.('tpl-text', 'tpl-1') },
      'select-template'
    ),
}));

jest.mock('@/app/_components/chat/template-selector-button', () => ({
  __esModule: true,
  default: ({ setInput }: any) =>
    React.createElement(
      'button',
      { type: 'button', onClick: () => setInput?.('tpl2-text', 'tpl-2') },
      'select-template2'
    ),
}));

jest.mock('@/app/_components/chat/ban-dialog', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, banWords }: any) =>
    React.createElement(
      'div',
      { 'data-testid': 'ban-dialog', 'data-open': String(!!isOpen) },
      React.createElement('div', { 'data-testid': 'ban-words' }, (banWords ?? []).join('|')),
      React.createElement('button', { type: 'button', onClick: onClose }, 'ban-close')
    ),
}));

jest.mock('@/app/(dashboard)/chat/[id]/_components/parameter-settings-button', () => ({
  __esModule: true,
  default: ({ onSettingsChange }: any) =>
    React.createElement(
      'button',
      { type: 'button', onClick: () => onSettingsChange?.('gpt-4.1') },
      'change-model'
    ),
}));

let fileHandlingMock: any;

jest.mock('@/app/(dashboard)/chat/[id]/_components/chat-utils', () => ({
  useFileHandling: () => fileHandlingMock,
}));

import { toast } from 'sonner';
import { deleteFile } from '@/app/_actions/deleteFile';
import { sendChat } from '@/app/_actions/sendChat';
import ChatThread from '@/app/(dashboard)/chat/[id]/_components/chat';

describe('ChatThread', () => {
  beforeEach(() => {
    refreshMock.mockReset();
    dispatchMock.mockReset();
    (toast.error as jest.Mock).mockReset();
    (toast.success as jest.Mock).mockReset();
    (sendChat as jest.Mock).mockReset();
    (deleteFile as jest.Mock).mockReset();
    selectedModel = 'gpt-5.2';

    fileHandlingMock = {
      fileUploading: false,
      fileNamedrag: 'x',
      setFileNamedrag: jest.fn(),
      input: '',
      files: [],
      setFiles: jest.fn(),
      setInput: jest.fn(),
      getRootProps: () => ({}),
      getInputProps: () => ({}),
      isDragActive: false,
      open: jest.fn(),
      removeFile: jest.fn(),
      handleFileUpload: jest.fn(),
    };

    (global.fetch as any) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ piiBool: false, piiList: [] }),
    });
  });

  test('L-01-001: 空文字は送信ボタンが無効', () => {
    (sendChat as jest.Mock).mockResolvedValue({ success: true, data: { content: 'ok' } });

    render(
      React.createElement(ChatThread, { id: 'ui', threadId: 't1', templates: [], banWords: [] })
    );
    expect(screen.getByRole('button', { name: '送信' })).toBeDisabled();
  });

  test.each([
    ['L-01-002', '   '],
    ['L-01-003', '\n\t'],
  ])('%s: 空白のみは送信ボタンが無効', async (_id, value) => {
    render(
      React.createElement(ChatThread, { id: 'ui', threadId: 't1', templates: [], banWords: [] })
    );
    fireEvent.change(screen.getByLabelText('chat-input'), { target: { value } });
    expect(screen.getByRole('button', { name: '送信' })).toBeDisabled();
  });

  test('N-01-001: 非空白入力は送信ボタンが有効', () => {
    render(
      React.createElement(ChatThread, { id: 'ui', threadId: 't1', templates: [], banWords: [] })
    );
    fireEvent.change(screen.getByLabelText('chat-input'), { target: { value: 'hello' } });
    expect(screen.getByRole('button', { name: '送信' })).toBeEnabled();
  });

  test('L-01-004: fileUploading 中は送信ボタンが無効', () => {
    fileHandlingMock.fileUploading = true;
    render(
      React.createElement(ChatThread, { id: 'ui', threadId: 't1', templates: [], banWords: [] })
    );
    fireEvent.change(screen.getByLabelText('chat-input'), { target: { value: 'hello' } });
    expect(screen.getByRole('button', { name: '送信' })).toBeDisabled();
  });

  test('I-01-001: 添付ボタンで open が呼ばれる', () => {
    render(
      React.createElement(ChatThread, { id: 'ui', threadId: 't1', templates: [], banWords: [] })
    );
    fireEvent.click(screen.getByRole('button', { name: 'attach' }));
    expect(fileHandlingMock.open).toHaveBeenCalledTimes(1);
  });

  test('I-01-002: ファイル削除ボタンで removeFile が呼ばれる', () => {
    render(
      React.createElement(ChatThread, { id: 'ui', threadId: 't1', templates: [], banWords: [] })
    );
    fireEvent.click(screen.getByRole('button', { name: 'remove-file' }));
    expect(fileHandlingMock.removeFile).toHaveBeenCalledTimes(1);
  });

  test('L-01-005: pasteでファイルが無い場合は handleFileUpload を呼ばない', () => {
    render(
      React.createElement(ChatThread, { id: 'ui', threadId: 't1', templates: [], banWords: [] })
    );
    fireEvent.paste(screen.getByLabelText('chat-input'), {
      clipboardData: { files: [] },
    });
    expect(fileHandlingMock.handleFileUpload).not.toHaveBeenCalled();
  });

  test('I-01-003: pasteでファイルがある場合は handleFileUpload を呼ぶ', () => {
    render(
      React.createElement(ChatThread, { id: 'ui', threadId: 't1', templates: [], banWords: [] })
    );

    const f = new File(['x'], 'a.txt', { type: 'text/plain' });
    fireEvent.paste(screen.getByLabelText('chat-input'), {
      clipboardData: { files: [f] },
    });

    expect(fileHandlingMock.handleFileUpload).toHaveBeenCalledTimes(1);
    expect(fileHandlingMock.handleFileUpload).toHaveBeenCalledWith([f]);
  });

  test('E-01-001: 禁止ワードが含まれる場合は送信せず ban ダイアログを開く', async () => {
    render(
      React.createElement(ChatThread, {
        id: 'ui',
        threadId: 't1',
        templates: [],
        banWords: [{ banWord: 'NG' }],
      })
    );

    fireEvent.change(screen.getByLabelText('chat-input'), { target: { value: 'hello NG' } });
    fireEvent.click(screen.getByRole('button', { name: '送信' }));

    await waitFor(() => {
      expect(screen.getByTestId('ban-dialog')).toHaveAttribute('data-open', 'true');
    });

    expect(sendChat).not.toHaveBeenCalled();
  });

  test('I-01-007: ban ダイアログは close で閉じられる', async () => {
    render(
      React.createElement(ChatThread, {
        id: 'ui',
        threadId: 't1',
        templates: [],
        banWords: [{ banWord: 'NG' }],
      })
    );

    fireEvent.change(screen.getByLabelText('chat-input'), { target: { value: 'hello NG' } });
    fireEvent.click(screen.getByRole('button', { name: '送信' }));

    await waitFor(() => {
      expect(screen.getByTestId('ban-dialog')).toHaveAttribute('data-open', 'true');
    });

    fireEvent.click(screen.getByRole('button', { name: 'ban-close' }));

    await waitFor(() => {
      expect(screen.getByTestId('ban-dialog')).toHaveAttribute('data-open', 'false');
    });
  });

  test('E-01-002: 禁止ワード判定処理が例外の場合は送信せず toast.error を出す', async () => {
    const bad = {
      get banWord() {
        throw new Error('bad-ban-word');
      },
    };

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
      // noop
    });

    try {
      render(
        React.createElement(ChatThread, {
          id: 'ui',
          threadId: 't1',
          templates: [],
          banWords: [bad as any],
        })
      );

      fireEvent.change(screen.getByLabelText('chat-input'), { target: { value: 'hello' } });

      // React の onSubmit を直接呼んで Promise の reject をテスト側で捕捉する
      const form = screen.getByRole('button', { name: '送信' }).closest('form')!;
      const reactPropsKey = Object.keys(form).find((k) => k.startsWith('__reactProps'));
      expect(reactPropsKey).toBeTruthy();

      const onSubmit = (form as any)[reactPropsKey as string].onSubmit as (e: any) => Promise<any>;

      await expect(onSubmit({ preventDefault: jest.fn() })).rejects.toThrow('bad-ban-word');

      expect(toast.error).toHaveBeenCalledWith('E_F_00100');
      expect(sendChat).not.toHaveBeenCalled();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  test('E-01-003: PII 検知時は送信せず PII ダイアログを開く', async () => {
    (global.fetch as any) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ piiBool: true, piiList: [{ category: 'email', text: 'a@b.com' }] }),
    });

    render(
      React.createElement(ChatThread, { id: 'ui', threadId: 't1', templates: [], banWords: [] })
    );

    fireEvent.change(screen.getByLabelText('chat-input'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: '送信' }));

    await waitFor(() => {
      expect(screen.getByTestId('pii-dialog')).toHaveAttribute('data-open', 'true');
      expect(screen.getByTestId('pii-count')).toHaveTextContent('1');
    });

    expect(sendChat).not.toHaveBeenCalled();
  });

  test('I-01-008: PII ダイアログは close で閉じられる', async () => {
    (global.fetch as any) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ piiBool: true, piiList: [{ category: 'email', text: 'a@b.com' }] }),
    });

    render(
      React.createElement(ChatThread, { id: 'ui', threadId: 't1', templates: [], banWords: [] })
    );

    fireEvent.change(screen.getByLabelText('chat-input'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: '送信' }));

    await waitFor(() => {
      expect(screen.getByTestId('pii-dialog')).toHaveAttribute('data-open', 'true');
    });

    fireEvent.click(screen.getByRole('button', { name: 'pii-close' }));

    await waitFor(() => {
      expect(screen.getByTestId('pii-dialog')).toHaveAttribute('data-open', 'false');
    });
  });

  test('E-01-004: PIIチェックでfetchが例外の場合は toast.error を出し送信しない', async () => {
    (global.fetch as any) = jest.fn().mockRejectedValue(new Error('network'));

    render(
      React.createElement(ChatThread, { id: 'ui', threadId: 't1', templates: [], banWords: [] })
    );

    fireEvent.change(screen.getByLabelText('chat-input'), { target: { value: 'hello' } });
    fireEvent.click(screen.getByRole('button', { name: '送信' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('E_F_00090');
    });
    expect(sendChat).not.toHaveBeenCalled();
  });

  test('L-01-006: PIIチェックのresponse.ok=falseでも送信を継続する', async () => {
    (global.fetch as any) = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    (sendChat as jest.Mock).mockResolvedValue({ success: true, data: { content: 'assistant' } });

    render(
      React.createElement(ChatThread, { id: 'ui', threadId: 't1', templates: [], banWords: [] })
    );

    fireEvent.change(screen.getByLabelText('chat-input'), { target: { value: 'hello' } });
    fireEvent.click(screen.getByRole('button', { name: '送信' }));

    await waitFor(() => {
      expect(sendChat).toHaveBeenCalledTimes(1);
    });
  });

  test('I-01-004: PII検知→confirmで再送信でき、2回目はPIIチェックをスキップする', async () => {
    (global.fetch as any) = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ piiBool: true, piiList: [{ category: 'email', text: 'a@b.com' }] }),
    });
    (sendChat as jest.Mock).mockResolvedValue({ success: true, data: { content: 'assistant' } });

    render(
      React.createElement(ChatThread, { id: 'ui', threadId: 't1', templates: [], banWords: [] })
    );

    fireEvent.change(screen.getByLabelText('chat-input'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: '送信' }));

    await waitFor(() => {
      expect(screen.getByTestId('pii-dialog')).toHaveAttribute('data-open', 'true');
    });
    expect(sendChat).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'pii-confirm' }));

    await waitFor(() => {
      expect(sendChat).toHaveBeenCalledTimes(1);
    });
    expect(global.fetch as any).toHaveBeenCalledTimes(1);
  });

  test('N-01-002: 入力して送信すると sendChat が呼ばれ、user/assistant が表示される', async () => {
    (sendChat as jest.Mock).mockResolvedValue({
      success: true,
      data: { content: 'assistant-reply', searchResults: [], recommend: [] },
    });

    render(
      React.createElement(ChatThread, { id: 'ui', threadId: 't1', templates: [], banWords: [] })
    );

    fireEvent.change(screen.getByLabelText('chat-input'), { target: { value: 'hello' } });
    fireEvent.click(screen.getByRole('button', { name: '送信' }));

    await waitFor(() => {
      expect(sendChat).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByTestId('message-list')).toHaveTextContent('user:hello');
      expect(screen.getByTestId('message-list')).toHaveTextContent('assistant:assistant-reply');
    });
  });

  test('N-01-003: sendChat 成功時は router.refresh が呼ばれる', async () => {
    (sendChat as jest.Mock).mockResolvedValue({
      success: true,
      data: { content: 'assistant', searchResults: [], recommend: [] },
    });

    render(
      React.createElement(ChatThread, { id: 'ui', threadId: 't1', templates: [], banWords: [] })
    );
    fireEvent.change(screen.getByLabelText('chat-input'), { target: { value: 'hello' } });
    fireEvent.click(screen.getByRole('button', { name: '送信' }));

    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalledTimes(1);
    });
  });

  test('N-01-004: sendChat 成功で recommend が表示される', async () => {
    (sendChat as jest.Mock).mockResolvedValue({
      success: true,
      data: { content: 'assistant', searchResults: [], recommend: ['a', 'b'] },
    });

    render(
      React.createElement(ChatThread, { id: 'ui', threadId: 't1', templates: [], banWords: [] })
    );
    fireEvent.change(screen.getByLabelText('chat-input'), { target: { value: 'hello' } });
    fireEvent.click(screen.getByRole('button', { name: '送信' }));

    await waitFor(() => {
      expect(screen.getByTestId('recommend')).toHaveTextContent('a|b');
    });
  });

  test('I-01-005: recommend-clickはskipValidationで送信する（PII fetch を呼ばない）', async () => {
    (global.fetch as any) = jest.fn().mockRejectedValue(new Error('should-not-call'));
    (sendChat as jest.Mock).mockResolvedValue({
      success: true,
      data: { content: 'assistant', searchResults: [], recommend: [] },
    });

    render(
      React.createElement(ChatThread, {
        id: 'ui',
        threadId: 't1',
        templates: [],
        banWords: [{ banWord: 'NG' }],
      })
    );

    fireEvent.click(screen.getByRole('button', { name: 'recommend-send' }));

    await waitFor(() => {
      expect(sendChat).toHaveBeenCalledTimes(1);
    });
    expect(global.fetch as any).not.toHaveBeenCalled();
  });

  test('N-01-005: テンプレ選択後に送信すると templateId が sendChat に渡る', async () => {
    (sendChat as jest.Mock).mockResolvedValue({
      success: true,
      data: { content: 'assistant', recommend: [] },
    });

    render(
      React.createElement(ChatThread, { id: 'ui', threadId: 't1', templates: [], banWords: [] })
    );

    fireEvent.click(screen.getByRole('button', { name: 'select-template' }));
    fireEvent.click(screen.getByRole('button', { name: 'select-template2' }));

    fireEvent.change(screen.getByLabelText('chat-input'), { target: { value: 'hello' } });
    fireEvent.click(screen.getByRole('button', { name: '送信' }));

    await waitFor(() => {
      expect(sendChat).toHaveBeenCalledTimes(1);
    });

    const arg = (sendChat as jest.Mock).mock.calls[0][0];
    expect(arg.templateId).toBe('tpl-2');
  });

  test('N-01-008: テンプレ選択で入力テキストが更新される', () => {
    render(
      React.createElement(ChatThread, { id: 'ui', threadId: 't1', templates: [], banWords: [] })
    );

    fireEvent.click(screen.getByRole('button', { name: 'select-template' }));

    expect(screen.getByLabelText('chat-input')).toHaveValue('tpl-text');
  });

  test('N-01-006: sendChat 成功で receivedFileText がある場合も処理できる', async () => {
    (sendChat as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        content: 'assistant',
        receivedFileText: 'file-text',
        searchResults: [],
        recommend: [],
      },
    });

    render(
      React.createElement(ChatThread, { id: 'ui', threadId: 't1', templates: [], banWords: [] })
    );
    fireEvent.change(screen.getByLabelText('chat-input'), { target: { value: 'hello' } });
    fireEvent.click(screen.getByRole('button', { name: '送信' }));

    await waitFor(() => {
      expect(screen.getByTestId('message-list')).toHaveTextContent('assistant:assistant');
    });
  });

  test('L-01-007: files がある場合、sendChat に fileUrl/mediaType/fileName が渡る', async () => {
    fileHandlingMock.files = [
      {
        file: new File(['x'], 'a.txt', { type: 'text/plain' }),
        url: 'u',
        name: 'temp/a.txt',
        type: 'text/plain',
      },
    ];
    (sendChat as jest.Mock).mockResolvedValue({
      success: true,
      data: { content: 'assistant', recommend: [] },
    });

    render(
      React.createElement(ChatThread, { id: 'ui', threadId: 't1', templates: [], banWords: [] })
    );
    fireEvent.change(screen.getByLabelText('chat-input'), { target: { value: 'hello' } });
    fireEvent.click(screen.getByRole('button', { name: '送信' }));

    await waitFor(() => {
      expect(sendChat).toHaveBeenCalledTimes(1);
    });
    const arg = (sendChat as jest.Mock).mock.calls[0][0];
    expect(arg.fileUrl).toBe('u');
    expect(arg.mediaType).toBe('text/plain');
    expect(arg.fileName).toBe('temp/a.txt');
  });

  test('I-01-006: 送信後に removeFile/setFileNamedrag が呼ばれ、deleteFile が実行される', async () => {
    fileHandlingMock.files = [
      {
        file: new File(['x'], 'a.txt', { type: 'text/plain' }),
        url: 'u1',
        name: 'temp/a.txt',
        type: 'text/plain',
      },
      {
        file: new File(['y'], 'b.txt', { type: 'text/plain' }),
        url: 'u2',
        name: 'temp/b.txt',
        type: 'text/plain',
      },
    ];
    (sendChat as jest.Mock).mockResolvedValue({
      success: true,
      data: { content: 'assistant', recommend: [] },
    });

    render(
      React.createElement(ChatThread, { id: 'ui', threadId: 't1', templates: [], banWords: [] })
    );
    fireEvent.change(screen.getByLabelText('chat-input'), { target: { value: 'hello' } });
    fireEvent.click(screen.getByRole('button', { name: '送信' }));

    await waitFor(() => {
      expect(fileHandlingMock.removeFile).toHaveBeenCalledTimes(1);
      expect(fileHandlingMock.setFileNamedrag).toHaveBeenCalledWith(null);
    });

    await waitFor(() => {
      expect(deleteFile).toHaveBeenCalledWith('temp/a.txt');
      expect(deleteFile).toHaveBeenCalledWith('temp/b.txt');
    });

    expect(fileHandlingMock.setFiles).toHaveBeenCalledWith([]);
  });

  test('E-01-005: sendChat 失敗時は toast.error を呼ぶ', async () => {
    (sendChat as jest.Mock).mockResolvedValue({
      success: false,
      message: 'bad',
    });

    render(
      React.createElement(ChatThread, { id: 'ui', threadId: 't1', templates: [], banWords: [] })
    );

    fireEvent.change(screen.getByLabelText('chat-input'), { target: { value: 'hello' } });
    fireEvent.click(screen.getByRole('button', { name: '送信' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  test('E-01-006: sendChat 失敗時、messageが空文字でも toast.error を呼ぶ', async () => {
    (sendChat as jest.Mock).mockResolvedValue({ success: false, message: '' });

    render(
      React.createElement(ChatThread, { id: 'ui', threadId: 't1', templates: [], banWords: [] })
    );

    fireEvent.change(screen.getByLabelText('chat-input'), { target: { value: 'hello' } });
    fireEvent.click(screen.getByRole('button', { name: '送信' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledTimes(1);
    });
  });

  test('E-01-007: sendChat 失敗時、messageがundefinedでも toast.error を呼ぶ', async () => {
    (sendChat as jest.Mock).mockResolvedValue({ success: false, message: undefined });

    render(
      React.createElement(ChatThread, { id: 'ui', threadId: 't1', templates: [], banWords: [] })
    );

    fireEvent.change(screen.getByLabelText('chat-input'), { target: { value: 'hello' } });
    fireEvent.click(screen.getByRole('button', { name: '送信' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledTimes(1);
    });
  });

  test('N-01-007: パラメータ設定変更で dispatch が呼ばれる', () => {
    render(
      React.createElement(ChatThread, { id: 'ui', threadId: 't1', templates: [], banWords: [] })
    );
    fireEvent.click(screen.getByRole('button', { name: 'change-model' }));
    expect(dispatchMock).toHaveBeenCalledWith({ type: 'setChatSelectedModel', payload: 'gpt-4.1' });
  });

  test('L-01-008: isDragActive=true の場合はドロップ案内が表示される', () => {
    fileHandlingMock.isDragActive = true;
    render(
      React.createElement(ChatThread, { id: 'ui', threadId: 't1', templates: [], banWords: [] })
    );
    expect(
      screen.getByText('ここにファイルをドロップしてメッセージに添付できます。')
    ).toBeInTheDocument();
    expect(screen.getByText('最大1ファイル、各20MBまで')).toBeInTheDocument();
  });

  test('L-01-009: 初期メッセージがある場合はテンプレ導線（空状態）が表示されない', () => {
    render(
      React.createElement(ChatThread, {
        id: 'ui',
        threadId: 't1',
        templates: [],
        banWords: [],
        initialMessages: [{ id: 'm1', role: 'assistant', content: 'hi' } as any],
      })
    );

    expect(screen.queryByText('プロンプトを選択して会話を始める')).not.toBeInTheDocument();
  });
});
