import { diffWords } from 'diff';
import { toast } from 'sonner';
import SvgCopy from '@/app/_components/icon/button/Copy';
import SvgDownload from '@/app/_components/icon/button/Download';
import FeedbackBadButton from '@/app/_components/usecase/feedback-bad-button';
import FeedbackGoodButton from '@/app/_components/usecase/feedback-good-button';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setFeedbackAt } from '@/app/_store/slice/text-correction';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { Button } from '../../../_components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../_components/ui/tooltip';

type Props = {
  originalText: string;
  correctedText: string;
  className?: string;
};

export default function ComparisonArea({
  originalText,
  correctedText,
  className,
}: Props): JSX.Element {
  const { id, feedbackAt } = useAppSelector((state) => state.textCorrection);
  const dispatch = useAppDispatch();
  const copyOriginalText = () => {
    navigator.clipboard.writeText(originalText);
    toast.success(getMessage('I_F_00050', '校正前の文章'));
  };

  const copyCorrectedText = () => {
    navigator.clipboard.writeText(correctedText);
    toast.success(getMessage('I_F_00050', '校正結果'));
  };

  // 校正前と校正後の差分を計算
  const diffParts = diffWords(originalText, correctedText);

  // 校正前の文章のハイライト表示
  const originalTextHighlighted = diffParts.map((part, index) => {
    if (part.removed) {
      // 削除された部分を赤色でハイライト
      return (
        <span
          key={index}
          className="whitespace-pre-wrap
        bg-yellow-200 line-through"
        >
          {part.value}
        </span>
      );
    } else if (!part.added) {
      // 変更されていない部分
      return (
        <span key={index} style={{ whiteSpace: 'pre-wrap' }}>
          {part.value}
        </span>
      );
    }
    // 追加された部分は校正前には表示しない
    return null;
  });

  // 校正後の文章のハイライト表示
  const correctedTextHighlighted = diffParts.map((part, index) => {
    if (part.added) {
      // 追加された部分を緑色でハイライト
      return (
        <span key={index} className="whitespace-pre-wrap bg-yellow-200">
          {part.value}
        </span>
      );
    } else if (!part.removed) {
      // 変更されていない部分
      return (
        <span key={index} style={{ whiteSpace: 'pre-wrap' }}>
          {part.value}
        </span>
      );
    }
    // 削除された部分は校正後には表示しない
    return null;
  });
  function downloadMessage() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${year}${month}${day}_${hours}${minutes}`;
    const element = document.createElement('a');
    const file = new Blob([correctedText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `文章校正_${timestamp}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
  const handleSubmit = () => {
    dispatch(setFeedbackAt(new Date()));
  };

  return (
    <div className={cn('h-full flex gap-x-3', className)}>
      <div className="flex h-full flex-1 flex-col">
        <div className="mb-1 flex items-end justify-between">
          <div className="text-base">校正前</div>
        </div>
        <div className="relative flex-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="icon"
                  size="icon"
                  onClick={copyOriginalText}
                  className="absolute right-1 top-1 z-10"
                >
                  <SvgCopy className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>コピー</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="h-full whitespace-pre-wrap rounded-lg border border-neutral-100 bg-white px-4 py-2.5 text-lg shadow-default">
            {originalTextHighlighted}
          </div>
          <div className="absolute bottom-1 right-4 text-xs text-neutral-400">
            {`${originalText.length.toLocaleString()}字`}
          </div>
        </div>
      </div>
      <div className="flex h-full flex-1 flex-col">
        <div className="mb-1 flex items-end justify-between">
          <div className="text-base">校正後</div>
          <div className="flex items-center">
            <FeedbackGoodButton
              source="textCorrection"
              messageId={id}
              isSubmitted={!!feedbackAt}
              handleSubmit={handleSubmit}
            />
            <FeedbackBadButton
              source="textCorrection"
              messageId={id}
              isSubmitted={!!feedbackAt}
              handleSubmit={handleSubmit}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="icon" size="icon" onClick={downloadMessage}>
                    <SvgDownload className="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>文章校正をダウンロード</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="relative flex-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="icon"
                  size="icon"
                  onClick={copyCorrectedText}
                  className="absolute right-1 top-1 z-10"
                >
                  <SvgCopy className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>コピー</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="h-full whitespace-pre-wrap rounded-lg border border-neutral-100 bg-white px-4 py-2.5 text-lg shadow-default">
            {correctedTextHighlighted}
          </div>
          <div className="absolute bottom-1 right-4 text-xs text-neutral-400">
            {`${correctedText.length.toLocaleString()}字`}
          </div>
        </div>
      </div>
    </div>
  );
}
