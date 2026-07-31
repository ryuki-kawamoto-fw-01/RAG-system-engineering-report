import { useState, useRef, useEffect, RefObject } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import SvgClose from '@/app/_components/icon/button/Close';
import SvgCopy from '@/app/_components/icon/button/Copy';
import SvgDownload from '@/app/_components/icon/button/Download';
import SvgEdit from '@/app/_components/icon/button/Edit';
import SvgSave from '@/app/_components/icon/button/Save';
import { Button } from '@/app/_components/ui/button';
import { Label } from '@/app/_components/ui/label';
import { Textarea } from '@/app/_components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/_components/ui/tooltip';
import { getMessage } from '@/app/_utils/message';
import { SummaryData } from '../_actions/summaryDataActions';
import { formatMarkdownText } from '../_utils/formatters';

type AdviceSectionProps = {
  summaryData: SummaryData;
  setSummaryData: (data: SummaryData) => void;
  containerRef: RefObject<HTMLDivElement>;
};

export default function AdviceSection({
  summaryData,
  setSummaryData,
  containerRef,
}: AdviceSectionProps) {
  const adviceRef = useRef<HTMLDivElement>(null);
  const [isEditingAdvice, setIsEditingAdvice] = useState(false);
  const [adviceContent, setAdviceContent] = useState('');
  const [originalAdviceContent, setOriginalAdviceContent] = useState('');
  const [isSavedAdvice, setIsSavedAdvice] = useState(false);

  // データが更新されたら状態をリセット
  useEffect(() => {
    if (summaryData && !isEditingAdvice && !isSavedAdvice) {
      setAdviceContent(summaryData.advice || '');
    }
  }, [summaryData, isEditingAdvice, isSavedAdvice]);

  // アドバイスのリッチテキストコピー
  const handleCopyAdvice = () => {
    if (adviceRef.current) {
      // プレーンテキスト（フォールバック用）
      const plainText = adviceRef.current.innerText || adviceRef.current.textContent || '';

      // HTML形式（書式付き）
      const htmlContent = adviceRef.current.innerHTML;

      // ClipboardItemを使用して両方のフォーマットを提供
      if (navigator.clipboard && navigator.clipboard.write) {
        // モダンなClipboard API
        const clipboardItem = new ClipboardItem({
          'text/plain': new Blob([plainText], { type: 'text/plain' }),
          'text/html': new Blob([htmlContent], { type: 'text/html' }),
        });

        navigator.clipboard
          .write([clipboardItem])
          .then(() => {
            toast.success(getMessage('I_F_00050', 'アドバイス'));
          })
          .catch(() => {
            // フォールバック：プレーンテキストのみ
            navigator.clipboard
              .writeText(plainText)
              .then(() => toast.success(getMessage('I_F_00050', 'アドバイス（書式なし）')))
              .catch(() => toast.error(getMessage('E_F_00170', 'アドバイス（書式なし）')));
          });
      } else {
        // 古いブラウザ用のフォールバック
        navigator.clipboard
          .writeText(plainText)
          .then(() => toast.success(getMessage('I_F_00050', 'アドバイス（書式なし）')))
          .catch(() => toast.error(getMessage('E_F_00170', 'アドバイス（書式なし）')));
      }
    }
  };

  // アドバイスのダウンロード
  const handleDownloadAdvice = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${year}${month}${day}_${hours}${minutes}`;

    const element = document.createElement('a');
    const file = new Blob([adviceContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `課題解決アドバイス_${timestamp}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success(getMessage('I_F_00060'));
  };

  // アドバイスの編集開始
  const handleEditAdvice = () => {
    setOriginalAdviceContent(adviceContent);
    setIsEditingAdvice(true);
  };

  // アドバイスの編集キャンセル
  const handleCancelAdvice = () => {
    setAdviceContent(originalAdviceContent);
    setIsEditingAdvice(false);
  };

  // アドバイスの保存
  const handleSaveAdvice = () => {
    const scrollPosition = containerRef.current?.scrollTop || 0;

    setIsSavedAdvice(true);
    setIsEditingAdvice(false);

    if (summaryData) {
      const updatedData = { ...summaryData, advice: adviceContent };
      setSummaryData(updatedData);

      // レンダリング後にスクロール位置を復元
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = scrollPosition;
        }
      });
    }
  };

  return (
    <div className="mb-3">
      <div className="mb-1 flex min-h-8 items-end justify-between">
        <Label className="text-base">アドバイス</Label>
        {!isEditingAdvice ? (
          <div className="flex items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="icon" size="icon" onClick={handleDownloadAdvice}>
                    <SvgDownload className="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>アドバイスをダウンロード</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="icon" size="icon" onClick={handleEditAdvice}>
                    <SvgEdit className="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>編集</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ) : (
          <div className="flex items-center gap-x-1.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="tertiary" size="sm" onClick={handleCancelAdvice}>
                    <SvgClose className="size-4" />
                    キャンセル
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>編集前に戻す</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="secondary" size="sm" onClick={handleSaveAdvice}>
                    <SvgSave className="size-4" />
                    保存
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>編集内容を保存</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
      <div className="relative h-full">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="icon"
                size="icon"
                onClick={handleCopyAdvice}
                className="absolute right-1 top-1 z-10"
              >
                <SvgCopy className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>アドバイスをコピー</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {isEditingAdvice ? (
          <Textarea
            onChange={(e) => {
              setAdviceContent(e.target.value);
            }}
            value={adviceContent}
            readOnly={!isEditingAdvice}
            className="size-full min-h-[400px] resize-none overflow-y-auto p-4"
          />
        ) : (
          <div
            className="prose prose-sm max-h-[800px] max-w-none overflow-y-auto rounded-lg bg-white p-6 shadow-default"
            ref={adviceRef}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ ...props }) => <p style={{ whiteSpace: 'pre-line' }} {...props} />,
                strong: ({ ...props }) => (
                  <>
                    <strong {...props} />
                    <br />
                  </>
                ),
              }}
            >
              {formatMarkdownText(adviceContent)}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
