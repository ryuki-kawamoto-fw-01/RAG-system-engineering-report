/** @jest-environment jsdom */

import '@testing-library/jest-dom';
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

let lastDropzoneOptions: any;
const dropzoneOpenMock = jest.fn();

jest.mock('react-dropzone', () => ({
  useDropzone: (options: any) => {
    lastDropzoneOptions = options;
    return {
      getRootProps: () => ({}),
      getInputProps: () => ({}),
      isDragActive: false,
      open: dropzoneOpenMock,
    };
  },
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock('@/app/_utils/message', () => ({
  getMessage: (code: string, ...args: any[]) => [code, ...args].join(':'),
}));

jest.mock('@/app/_actions/uploadFile', () => ({
  uploadFile: jest.fn(),
}));

import { toast } from 'sonner';
import { uploadFile } from '@/app/_actions/uploadFile';
import { useFileHandling } from '@/app/(dashboard)/chat/[id]/_components/chat-utils';

function Harness() {
  const [parentInput, setParentInput] = React.useState('');
  const {
    input,
    files,
    fileUploading,
    fileNamedrag,
    setFileNamedrag,
    handleFileUpload,
    removeFile,
    open,
    setInput,
  } = useFileHandling('', setParentInput);

  return React.createElement(
    'div',
    {},
    React.createElement('div', { 'data-testid': 'input' }, input),
    React.createElement('div', { 'data-testid': 'parentInput' }, parentInput),
    React.createElement('div', { 'data-testid': 'uploading' }, String(fileUploading)),
    React.createElement('div', { 'data-testid': 'fileNamedrag' }, fileNamedrag ?? ''),
    React.createElement('div', { 'data-testid': 'fileCount' }, String(files.length)),
    React.createElement('div', { 'data-testid': 'fileType' }, files[0]?.type ?? ''),
    React.createElement(
      'button',
      {
        onClick: () => {
          const f = new File(['x'], 'image.jpg', { type: '' });
          void handleFileUpload([f]);
        },
      },
      'upload-jpg'
    ),
    React.createElement(
      'button',
      {
        onClick: () => {
          const f = new File(['x'], 'image.jpeg', { type: '' });
          void handleFileUpload([f]);
        },
      },
      'upload-jpeg'
    ),
    React.createElement(
      'button',
      {
        onClick: () => {
          const f = new File(['x'], 'image.png', { type: '' });
          void handleFileUpload([f]);
        },
      },
      'upload-png'
    ),
    React.createElement(
      'button',
      {
        onClick: () => {
          const f = new File(['x'], 'note.txt', { type: 'text/plain' });
          void handleFileUpload([f]);
        },
      },
      'upload-txt'
    ),
    React.createElement(
      'button',
      {
        onClick: () => {
          const f1 = new File(['a'], 'a.txt', { type: 'text/plain' });
          const f2 = new File(['b'], 'b.txt', { type: 'text/plain' });
          void handleFileUpload([f1, f2]);
        },
      },
      'upload-two-files'
    ),
    React.createElement(
      'button',
      {
        onClick: () => removeFile(),
      },
      'remove'
    ),
    React.createElement(
      'button',
      {
        onClick: () => open(),
      },
      'open-dropzone'
    ),
    React.createElement(
      'button',
      {
        onClick: () => setFileNamedrag('dragging'),
      },
      'set-fileNamedrag'
    ),
    React.createElement(
      'button',
      {
        onClick: () => setInput('hello'),
      },
      'setInput'
    )
  );
}

describe('useFileHandling', () => {
  beforeEach(() => {
    (toast.error as jest.Mock).mockReset();
    (uploadFile as jest.Mock).mockReset();
    dropzoneOpenMock.mockReset();
    lastDropzoneOptions = undefined;
  });

  test.each([
    ['N-01-001', 'upload-jpg', 'image.jpg', 'image/jpeg'],
    ['N-01-002', 'upload-jpeg', 'image.jpeg', 'image/jpeg'],
    ['N-01-003', 'upload-png', 'image.png', 'image/png'],
    ['N-01-004', 'upload-txt', 'note.txt', 'text/plain'],
  ])(
    '%s: MIMEタイプが正しく扱われ、files/input/parentInput が更新される',
    async (_id, buttonName, fileName, expectedType) => {
      (uploadFile as jest.Mock).mockResolvedValue({
        success: true,
        url: 'https://example.com/u',
        filename: `temp/${fileName}`,
      });

      render(React.createElement(Harness));

      fireEvent.click(screen.getByRole('button', { name: buttonName }));

      await waitFor(() => {
        expect(uploadFile).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(screen.getByTestId('uploading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('fileCount')).toHaveTextContent('1');
      expect(screen.getByTestId('fileType')).toHaveTextContent(expectedType);
      expect(screen.getByTestId('input')).toHaveTextContent(fileName);
      expect(screen.getByTestId('parentInput')).toHaveTextContent(fileName);
    }
  );

  test('N-01-005: acceptedFiles の最後のファイルが採用される', async () => {
    (uploadFile as jest.Mock).mockResolvedValue({
      success: true,
      url: 'https://example.com/u',
      filename: 'temp/b.txt',
    });

    render(React.createElement(Harness));

    fireEvent.click(screen.getByRole('button', { name: 'upload-two-files' }));

    await waitFor(() => {
      expect(screen.getByTestId('input')).toHaveTextContent('b.txt');
    });
    expect(screen.getByTestId('input')).not.toHaveTextContent('a.txt');
  });

  test('N-01-006: 既存inputがある場合は改行で追記される', async () => {
    (uploadFile as jest.Mock).mockResolvedValue({
      success: true,
      url: 'https://example.com/u',
      filename: 'temp/note.txt',
    });

    render(React.createElement(Harness));

    fireEvent.click(screen.getByRole('button', { name: 'setInput' }));
    expect(screen.getByTestId('input')).toHaveTextContent('hello');

    fireEvent.click(screen.getByRole('button', { name: 'upload-txt' }));

    await waitFor(() => {
      expect(screen.getByTestId('input')).toHaveTextContent('hello\nnote.txt', {
        normalizeWhitespace: false,
      });
    });
    expect(screen.getByTestId('parentInput')).toHaveTextContent('hello\nnote.txt', {
      normalizeWhitespace: false,
    });
  });

  test('N-01-007: setInput は parentInput と同期する', () => {
    render(React.createElement(Harness));
    fireEvent.click(screen.getByRole('button', { name: 'setInput' }));
    expect(screen.getByTestId('input')).toHaveTextContent('hello');
    expect(screen.getByTestId('parentInput')).toHaveTextContent('hello');
  });

  test('I-01-001: Dropzone の open を呼び出せる', () => {
    render(React.createElement(Harness));
    fireEvent.click(screen.getByRole('button', { name: 'open-dropzone' }));
    expect(dropzoneOpenMock).toHaveBeenCalledTimes(1);
  });

  test('I-01-002: useDropzone の onDrop からアップロード処理が呼ばれる', async () => {
    (uploadFile as jest.Mock).mockResolvedValue({
      success: true,
      url: 'https://example.com/u',
      filename: 'temp/note.txt',
    });

    render(React.createElement(Harness));

    expect(lastDropzoneOptions).toBeDefined();
    const f = new File(['x'], 'note.txt', { type: 'text/plain' });
    await act(async () => {
      await lastDropzoneOptions.onDrop([f]);
    });

    await waitFor(() => {
      expect(uploadFile).toHaveBeenCalledTimes(1);
    });
  });

  test('E-01-001: アップロード失敗時は toast.error を表示する', async () => {
    (uploadFile as jest.Mock).mockResolvedValue({ success: false });

    render(React.createElement(Harness));

    fireEvent.click(screen.getByRole('button', { name: 'upload-txt' }));

    await waitFor(() => {
      expect(uploadFile).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('E_F_00160');
    });
  });

  test('E-01-002: uploadFile が例外を投げた場合、例外メッセージを toast.error に表示する', async () => {
    (uploadFile as jest.Mock).mockRejectedValue(new Error('boom'));

    render(React.createElement(Harness));
    fireEvent.click(screen.getByRole('button', { name: 'upload-txt' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('boom');
    });
  });

  test('E-01-003: uploadFile がError以外を投げた場合はデフォルトメッセージを表示する', async () => {
    (uploadFile as jest.Mock).mockRejectedValue({});

    render(React.createElement(Harness));
    fireEvent.click(screen.getByRole('button', { name: 'upload-txt' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('E_F_00160');
    });
  });

  test.each([
    ['E-01-004', 'file-too-large', 'E_F_00130'],
    ['E-01-005', 'file-too-small', 'E_F_00135'],
  ])(
    '%s: onDropRejected のサイズエラーは専用メッセージを表示する',
    async (_id, code, expectedPrefix) => {
      render(React.createElement(Harness));

      expect(lastDropzoneOptions).toBeDefined();
      lastDropzoneOptions.onDropRejected([
        {
          file: new File(['x'], 'bad.bin', { type: 'application/octet-stream' }),
          errors: [{ code }],
        },
      ]);

      await waitFor(() => {
        const arg = (toast.error as jest.Mock).mock.calls[0]?.[0] as string;
        expect(arg.startsWith(`${expectedPrefix}:`)).toBe(true);
      });
    }
  );

  test('E-01-006: onDropRejected の file-invalid-type は拡張子候補を含むメッセージを表示する', async () => {
    render(React.createElement(Harness));

    expect(lastDropzoneOptions).toBeDefined();
    lastDropzoneOptions.onDropRejected([
      {
        file: new File(['x'], 'bad.exe', { type: 'application/x-msdownload' }),
        errors: [{ code: 'file-invalid-type' }],
      },
    ]);

    await waitFor(() => {
      const arg = (toast.error as jest.Mock).mock.calls[0]?.[0] as string;
      expect(arg.startsWith('E_F_00120:')).toBe(true);
      expect(arg).toContain('.pdf');
    });
  });

  test('E-01-007: onDropRejected の未知コードは汎用メッセージを表示する', async () => {
    render(React.createElement(Harness));

    expect(lastDropzoneOptions).toBeDefined();
    lastDropzoneOptions.onDropRejected([
      {
        file: new File(['x'], 'bad.bin', { type: 'application/octet-stream' }),
        errors: [{ code: 'something-else' }],
      },
    ]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('E_F_00160');
    });
  });

  test('L-01-001: removeFile で files が減る（末尾削除）', async () => {
    (uploadFile as jest.Mock).mockResolvedValue({
      success: true,
      url: 'https://example.com/u',
      filename: 'temp/note.txt',
    });

    render(React.createElement(Harness));

    fireEvent.click(screen.getByRole('button', { name: 'upload-txt' }));

    await waitFor(() => {
      expect(screen.getByTestId('fileCount')).toHaveTextContent('1');
    });

    fireEvent.click(screen.getByRole('button', { name: 'remove' }));
    expect(screen.getByTestId('fileCount')).toHaveTextContent('0');
  });

  test('L-01-002: files が空のとき removeFile しても0のまま', () => {
    render(React.createElement(Harness));
    expect(screen.getByTestId('fileCount')).toHaveTextContent('0');
    fireEvent.click(screen.getByRole('button', { name: 'remove' }));
    expect(screen.getByTestId('fileCount')).toHaveTextContent('0');
  });

  test('L-01-003: アップロード中は fileUploading が true になる', async () => {
    let resolveUpload: (value: any) => void;
    const pending = new Promise((resolve) => {
      resolveUpload = resolve;
    });
    (uploadFile as jest.Mock).mockReturnValue(pending);

    render(React.createElement(Harness));

    fireEvent.click(screen.getByRole('button', { name: 'upload-txt' }));

    await waitFor(() => {
      expect(screen.getByTestId('uploading')).toHaveTextContent('true');
    });

    resolveUpload!({ success: true, url: 'https://example.com/u', filename: 'temp/note.txt' });

    await waitFor(() => {
      expect(screen.getByTestId('uploading')).toHaveTextContent('false');
    });
  });

  test('I-01-003: removeFile は fileNamedrag もクリアする', async () => {
    (uploadFile as jest.Mock).mockResolvedValue({
      success: true,
      url: 'https://example.com/u',
      filename: 'temp/note.txt',
    });

    render(React.createElement(Harness));

    fireEvent.click(screen.getByRole('button', { name: 'set-fileNamedrag' }));
    expect(screen.getByTestId('fileNamedrag')).toHaveTextContent('dragging');

    fireEvent.click(screen.getByRole('button', { name: 'upload-txt' }));
    await waitFor(() => {
      expect(screen.getByTestId('fileCount')).toHaveTextContent('1');
    });

    fireEvent.click(screen.getByRole('button', { name: 'remove' }));
    expect(screen.getByTestId('fileNamedrag')).toHaveTextContent('');
  });
});
