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

type SummarySectionProps = {
  summaryData: SummaryData;
  setSummaryData: (data: SummaryData) => void;
  containerRef: RefObject<HTMLDivElement>;
};

export default function SummarySection({
  summaryData,
  setSummaryData,
  containerRef,
}: SummarySectionProps) {
  const summaryRef = useRef<HTMLDivElement>(null);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [summaryContent, setSummaryContent] = useState('');
  const [originalSummaryContent, setOriginalSummaryContent] = useState('');
  const [isSavedSummary, setIsSavedSummary] = useState(false);

  // データが更新されたら状態をリセット
  useEffect(() => {
    if (summaryData && !isEditingSummary && !isSavedSummary) {
      setSummaryContent(summaryData.summary || '');
    }
  }, [summaryData, isEditingSummary, isSavedSummary]);

  // まとめのリッチテキストコピー
  const handleCopySummary = () => {
    if (summaryRef.current) {
      // プレーンテキスト（フォールバック用）
      const plainText = summaryRef.current.innerText || summaryRef.current.textContent || '';

      // HTML形式（書式付き）
      const htmlContent = summaryRef.current.innerHTML;

      // ClipboardItemを使用して両方のフォーマットを提供
      if (navigator.clipboard && navigator.clipboard.write) {
        // モダンなClipboard API
        const clipboardItem = new ClipboardItem({
          'text/plain': new Blob([plainText], { type: 'text/plain' }),
          'text/html': new Blob([htmlContent], { type: 'text/html' }),
        });

        navigator.clipboard
          .write([clipboardItem])
          .then(() => toast.success(getMessage('I_F_00050', 'まとめ')))
          .catch(() => {
            // フォールバック：プレーンテキストのみ
            navigator.clipboard
              .writeText(plainText)
              .then(() => toast.success(getMessage('I_F_00050', 'まとめ（書式なし）')))
              .catch(() => toast.error(getMessage('E_F_00170', 'まとめ（書式なし）')));
          });
      } else {
        // 古いブラウザ用のフォールバック
        navigator.clipboard
          .writeText(plainText)
          .then(() => toast.success(getMessage('I_F_00050', 'まとめ（書式なし）')))
          .catch(() => toast.error(getMessage('E_F_00170', 'まとめ（書式なし）')));
      }
    }
  };

  // まとめのダウンロード
  const handleDownloadSummary = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${year}${month}${day}_${hours}${minutes}`;

    const element = document.createElement('a');
    const file = new Blob([summaryContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `課題解決まとめ_${timestamp}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success(getMessage('I_F_00060'));
  };

  // まとめの編集開始
  const handleEditSummary = () => {
    setOriginalSummaryContent(summaryContent);
    setIsEditingSummary(true);
  };

  // まとめの編集キャンセル
  const handleCancelSummary = () => {
    setSummaryContent(originalSummaryContent);
    setIsEditingSummary(false);
  };

  // まとめの保存
  const handleSaveSummary = () => {
    const scrollPosition = containerRef.current?.scrollTop || 0;

    setIsSavedSummary(true);
    setIsEditingSummary(false);

    if (summaryData) {
      const updatedData = { ...summaryData, summary: summaryContent };
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
        <Label className="text-base">まとめ</Label>
        {!isEditingSummary ? (
          <div className="flex items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="icon" size="icon" onClick={handleDownloadSummary}>
                    <SvgDownload className="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>まとめをダウンロード</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="icon" size="icon" onClick={handleEditSummary}>
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
                  <Button type="button" variant="tertiary" size="sm" onClick={handleCancelSummary}>
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
                  <Button type="button" variant="secondary" size="sm" onClick={handleSaveSummary}>
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
                onClick={handleCopySummary}
                className="absolute right-1 top-1 z-10"
              >
                <SvgCopy className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>まとめをコピー</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {isEditingSummary ? (
          <Textarea
            className="min-h-[400px] resize-none overflow-y-auto p-4"
            value={summaryContent}
            onChange={(e) => setSummaryContent(e.target.value)}
          />
        ) : (
          <div
            className="prose prose-sm max-h-[800px] max-w-none overflow-y-auto rounded-lg bg-white p-6 shadow-default"
            ref={summaryRef}
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
              {formatMarkdownText(summaryContent)}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
