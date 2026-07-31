'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import SvgClose from '@/app/_components/icon/button/Close';
import SvgCopy from '@/app/_components/icon/button/Copy';
import SvgDownload from '@/app/_components/icon/button/Download';
import SvgEdit from '@/app/_components/icon/button/Edit';
import SvgSave from '@/app/_components/icon/button/Save';
import FeedbackBadButton from '@/app/_components/usecase/feedback-bad-button';
import FeedbackGoodButton from '@/app/_components/usecase/feedback-good-button';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setResult, setFeedbackAt } from '@/app/_store/slice/text-check';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { Button } from '../../../_components/ui/button';
import { Label } from '../../../_components/ui/label';
import Markdown from '../../../_components/ui/markdown';
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

export default function TextCheckResultArea({ className }: Props) {
  const dispatch = useAppDispatch();
  const { evaluation, correctedText, id, feedbackAt } = useAppSelector((state) => state.textCheck);

  // 追加: 表示内容の状態
  const [showCorrected, setShowCorrected] = useState(false);

  // 編集用stateなどはそのまま
  const [editValue, setEditValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const markdownRef = useRef<HTMLDivElement>(null);

  const displayedValue = showCorrected ? correctedText : evaluation;

  // 編集内容の初期化
  useEffect(() => {
    setEditValue(displayedValue);
  }, [displayedValue]);

  const copyResult = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (markdownRef.current) {
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
      navigator.clipboard.writeText(displayedValue);
      toast.success(getMessage('I_F_00050', '作成結果'));
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };
  const handleCancel = () => {
    setEditValue(displayedValue);
    setIsEditing(false);
  };

  const handleSave = () => {
    if (showCorrected) {
      dispatch(setResult({ evaluation, correctedText: editValue, feedbackAt }));
    } else {
      dispatch(setResult({ evaluation: editValue, correctedText, feedbackAt }));
    }
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

    // showCorrectedの状態でファイル名を分岐
    const fileTitle = showCorrected ? '修正文' : '文章の指摘ポイント';
    const element = document.createElement('a');
    const file = new Blob([displayedValue], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${fileTitle}_${timestamp}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
  const handleSubmit = () => {
    dispatch(setFeedbackAt(new Date()));
  };

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="mb-1 flex min-h-8 shrink-0 items-end justify-between">
        <Label className="text-base">{showCorrected ? '修正文' : '作成結果'}</Label>
        <div className="relative h-full">
          {/* 既存の編集・ダウンロード等のボタン */}
          {!isEditing ? (
            <div className="flex items-center">
              <FeedbackGoodButton
                source="textCheck"
                messageId={id}
                isSubmitted={!!feedbackAt}
                handleSubmit={handleSubmit}
              />
              <FeedbackBadButton
                source="textCheck"
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
                    <p>文章の指摘ポイントをダウンロード</p>
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
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col pb-[64px]">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="icon"
                size="icon"
                onClick={copyResult}
                className="absolute right-1 top-1 z-10"
              >
                <SvgCopy className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>コピー</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {!isEditing ? (
          <div className="h-full overflow-auto rounded-lg border bg-white px-4 py-2 shadow">
            <div ref={markdownRef}>
              {editValue ? (
                <div className="prose max-w-none break-words">
                  <Markdown>{editValue.replace(/<\/?b>/g, '**')}</Markdown>
                </div>
              ) : (
                <span className="text-base text-gray-400">
                  {showCorrected
                    ? 'ここに修正文が表示されます'
                    : 'ここに生成された文章の指摘ポイントが表示されます'}
                </span>
              )}
            </div>
          </div>
        ) : (
          <Textarea
            onChange={(e) => setEditValue(e.target.value)}
            value={editValue}
            placeholder={
              showCorrected
                ? 'ここに修正文が表示されます'
                : 'ここに生成された文章の指摘ポイントが表示されます'
            }
            readOnly={!isEditing}
            className="h-full"
          />
        )}
      </div>
      {correctedText && correctedText.trim() !== '' && (
        <Button
          type="button"
          variant="secondary"
          className="absolute bottom-0 left-1/2 w-full max-w-[180px] -translate-x-1/2"
          onClick={() => setShowCorrected((prev) => !prev)}
        >
          {showCorrected ? '評価を表示' : '修正文を表示'}
        </Button>
      )}
    </div>
  );
}
