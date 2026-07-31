import Encoding from 'encoding-japanese';
import { Download } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getQA } from '@/app/(dashboard)/rag-chat/_actions/getPastQa';
import { formatFileSize } from '@/app/_utils/format-file-size';
import { MAX_CSV_VIEW_SIZE, MAX_PDF_VIEW_SIZE } from '../../../../config';
import SvgClose from '../icon/button/Close';
import { Button } from './button';

type FileViewerProps = {
  url: string | null;
  downloadUrl: string | null;
  name: string;
  size: number | null;
  onClose?: () => void;
};

type PreviewFileType = 'txt' | 'ms' | 'pdf' | 'faq' | 'invalid';

const fileTypeMapping: { [key: string]: PreviewFileType } = {
  '.pdf': 'pdf',
  '.txt': 'txt',
  '.csv': 'txt',
  '.pptx': 'pdf',
  '.xlsx': 'pdf',
  '.docx': 'pdf',
};

export default function FileViewer({ url, downloadUrl, name, size, onClose }: FileViewerProps) {
  const [preview, setPreview] = useState<string>('');
  const fileType = useMemo(() => {
    if (name.startsWith('FAQ ID:')) return 'faq';
    const ext = Object.keys(fileTypeMapping).find((ext) => name.endsWith(ext));
    return ext ? fileTypeMapping[ext] : 'invalid';
  }, [name]);

  function getFileExt(filename: string) {
    return filename.split('.').pop()?.toUpperCase() || '';
  }
  const fetchPreview = useCallback(
    async (url: string): Promise<string> => {
      if (fileType === 'faq') {
        const textFaq = await getQA(url);
        return textFaq.qaString ?? '';
      }
      const res = fetch(url);
      const file = await res.then((response) => response.blob());
      // content-typeが正しく設定されてない場合表示用に書き換える
      if (fileType === 'pdf' && file.type !== 'application/pdf') {
        const newFile = new Blob([file], { type: 'application/pdf' });
        URL.createObjectURL(newFile);
        return URL.createObjectURL(newFile);
      }
      if (fileType === 'txt') {
        let text;
        const arrayBuffer = await file.arrayBuffer();
        const detectedEncoding = Encoding.detect(new Uint8Array(arrayBuffer));
        if (detectedEncoding === 'SJIS') {
          const decoder = new TextDecoder('shift_jis');
          text = decoder.decode(arrayBuffer);
        } else {
          const decoder = new TextDecoder('utf-8');
          text = decoder.decode(arrayBuffer);
        }

        return text;
      }
      return url;
    },
    [fileType]
  );

  useEffect(() => {
    if (url && url !== '') {
      fetchPreview(url)
        .then((preview) => {
          setPreview(preview);
        })
        .catch((error) => console.error(`Error fetching ${fileType} file:`, error));
    }
  }, [url, fileType, fetchPreview]);

  async function downloadContent(fileUrl: string) {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = name;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  }

  function renderContent() {
    if (name === '') return <p />;
    // faqの場合はsizeがnullでも許容する
    if (!url || (fileType !== 'faq' && !size))
      return <p className="text-neutral-500">ファイルの読み込みに失敗しました。</p>;

    switch (fileType) {
      case 'pdf':
        if (size && size < MAX_PDF_VIEW_SIZE) {
          return (
            <div className="size-full overflow-auto">
              <iframe src={preview} className="size-full" title="file-preview" />
            </div>
          );
        }
        return (
          <p className="text-neutral-500">
            ファイルのサイズが表示上限を超えています。閲覧したい場合は、ダウンロードしてください。
          </p>
        );
      case 'txt':
        if (size && size < MAX_CSV_VIEW_SIZE) {
          return (
            <pre className="max-w-full whitespace-pre-wrap break-all text-sm text-neutral-700">
              {preview}
            </pre>
          );
        }
        return (
          <p className="text-neutral-500">
            ファイルのサイズが表示上限を超えています。閲覧したい場合は、ダウンロードしてください。
          </p>
        );
      case 'faq':
        return (
          <div className="whitespace-pre-wrap break-words text-sm text-neutral-700">{preview}</div>
        );
      default:
        return (
          <p className="text-neutral-500">
            対応していないファイル形式です。閲覧したい場合は、ダウンロードしてください。
          </p>
        );
    }
  }

  return (
    <div className="flex size-full max-w-full flex-col justify-start overflow-hidden bg-white shadow-file">
      {/* ヘッダー */}
      <div className="flex shrink-0 items-center justify-between gap-3 self-stretch border-b border-neutral-100 bg-white px-5 py-3">
        <div className="w-full text-base font-bold text-neutral-900">
          <div className="max-w-[400px] truncate">{name}</div>
        </div>
        {onClose && (
          <Button variant="icon" size="icon" onClick={onClose}>
            <SvgClose className="size-5" />
          </Button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1 self-stretch overflow-hidden px-5 py-3">
        {/* アクション部分 */}
        <div className="flex w-full items-center justify-end gap-2">
          {size && (
            <div className="text-xs text-neutral-500">
              {`${getFileExt(name)}: ${formatFileSize({ bytes: size })}`}
            </div>
          )}
          {downloadUrl && (
            <Button onClick={() => downloadContent(downloadUrl)} variant="tertiary" size="sm">
              <Download size={13} />
              <span className="text-sm font-medium text-neutral-900">ダウンロード</span>
            </Button>
          )}
        </div>

        {/* コンテンツ部分 */}
        <div className="w-full max-w-full flex-1 overflow-auto">{renderContent()}</div>
      </div>
    </div>
  );
}
