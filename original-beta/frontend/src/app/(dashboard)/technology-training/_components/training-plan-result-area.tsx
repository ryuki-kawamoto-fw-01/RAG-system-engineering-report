'use client';

import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import SvgClose from '@/app/_components/icon/button/Close';
import SvgCopy from '@/app/_components/icon/button/Copy';
import SvgDownload from '@/app/_components/icon/button/Download';
import SvgEdit from '@/app/_components/icon/button/Edit';
import SvgSave from '@/app/_components/icon/button/Save';
import Markdown from '@/app/_components/ui/markdown';
import { ScrollArea } from '@/app/_components/ui/scroll-area';
import FeedbackBadButton from '@/app/_components/usecase/feedback-bad-button';
import FeedbackGoodButton from '@/app/_components/usecase/feedback-good-button';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setResult, setFeedbackAt } from '@/app/_store/slice/technology-training';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { Button } from '../../../_components/ui/button';
import { Label } from '../../../_components/ui/label';
import { Textarea } from '../../../_components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../_components/ui/tooltip';

type Props = {
  className?: string;
};

export default function TrainingPlanResultArea({ className }: Props) {
  const dispatch = useAppDispatch();
  const { result, id, feedbackAt } = useAppSelector((state) => state.technologyTraining);
  const [preEditContent, setPreEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const markdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPreEditContent(result);
  }, [result]);

  const copyResult = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!isEditing && markdownRef.current) {
      const plainText = markdownRef.current.innerText || markdownRef.current.textContent || '';
      const htmlContent = markdownRef.current.innerHTML;

      if (navigator.clipboard && navigator.clipboard.write) {
        const clipboardItem = new ClipboardItem({
          'text/plain': new Blob([plainText], { type: 'text/plain' }),
          'text/html': new Blob([htmlContent], { type: 'text/html' }),
        });
        navigator.clipboard
          .write([clipboardItem])
          .then(() => toast.success(getMessage('I_F_00050', '作成結果')))
          .catch(() => {
            navigator.clipboard
              .writeText(plainText)
              .then(() => toast.success(getMessage('I_F_00050', '作成結果（書式なし）')))
              .catch(() => toast.error(getMessage('E_F_00170', '作成結果（書式なし）')));
          });
      } else {
        navigator.clipboard
          .writeText(plainText)
          .then(() => toast.success(getMessage('I_F_00050', '作成結果（書式なし）')))
          .catch(() => toast.error(getMessage('E_F_00170', '作成結果（書式なし）')));
      }
    } else {
      navigator.clipboard.writeText(isEditing ? preEditContent : result);
      toast.success(getMessage('I_F_00050', '作成結果'));
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };
  const handleCancel = () => {
    setPreEditContent(result);
    setIsEditing(false);
  };

  const handleSave = () => {
    dispatch(setResult({ result: preEditContent, feedbackAt }));
    setIsEditing(false);
  };
  function downloadMessage() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${year}${month}${day}_${hours}${minutes}`;
    const element = document.createElement('a');
    const file = new Blob([result], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `トレーニング計画_${timestamp}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
  const handleSubmit = () => {
    dispatch(setFeedbackAt(new Date()));
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="mb-1 flex min-h-8 items-end justify-between">
        <Label className="text-base">作成結果</Label>
        {!isEditing ? (
          <div className="flex items-center">
            <FeedbackGoodButton
              source="technologyTraining"
              messageId={id}
              isSubmitted={!!feedbackAt}
              handleSubmit={handleSubmit}
            />
            <FeedbackBadButton
              source="technologyTraining"
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
                  <p>トレーニング計画をダウンロード</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="icon" size="icon" onClick={handleEdit}>
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
                  <Button type="button" variant="tertiary" size="sm" onClick={handleCancel}>
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
                  <Button type="button" variant="secondary" size="sm" onClick={handleSave}>
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
                onClick={copyResult}
                className="absolute right-2 top-1 z-10"
              >
                <SvgCopy className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>コピー</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {isEditing ? (
          <Textarea
            value={preEditContent}
            onChange={(e) => setPreEditContent(e.target.value)}
            className="size-full"
          />
        ) : (
          <ScrollArea className="size-full rounded-lg border bg-white px-4 py-2 shadow">
            {result ? (
              <Markdown>{result.replace(/<\/?b>/g, '**')}</Markdown>
            ) : (
              <span className="text-base text-gray-400">
                ここに生成されたトレーニング計画が表示されます
              </span>
            )}
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
