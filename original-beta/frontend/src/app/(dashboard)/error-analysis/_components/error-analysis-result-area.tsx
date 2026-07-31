'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import SvgClose from '@/app/_components/icon/button/Close';
import SvgCopy from '@/app/_components/icon/button/Copy';
import SvgDownload from '@/app/_components/icon/button/Download';
import SvgEdit from '@/app/_components/icon/button/Edit';
import SvgSave from '@/app/_components/icon/button/Save';
import FeedbackBadButton from '@/app/_components/usecase/feedback-bad-button';
import FeedbackGoodButton from '@/app/_components/usecase/feedback-good-button';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setResult, setFeedbackAt } from '@/app/_store/slice/error-analysis';
import { getMessage } from '@/app/_utils/message';
import { Button } from '../../../_components/ui/button';
import { Label } from '../../../_components/ui/label';
import Markdown from '../../../_components/ui/markdown';
import { ScrollArea } from '../../../_components/ui/scroll-area';
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

export default function ErrorAnalysisResultArea({ className }: Props) {
  const dispatch = useAppDispatch();
  const { result, id, feedbackAt } = useAppSelector((state) => state.errorAnalysis);
  const [preEditContent, setPreEditContent] = useState({ explanation: '', solutionAndExample: '' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setPreEditContent(result);
  }, [result]);

  const copyExplanation = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    navigator.clipboard.writeText(result.explanation);
    toast.success(getMessage('I_F_00050', 'エラーの説明'));
  };

  const copySolution = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    navigator.clipboard.writeText(result.solutionAndExample);
    toast.success(getMessage('I_F_00050', '解決策と修正例'));
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
    const fullText = `${result.explanation}\n\n${result.solutionAndExample}`;
    const element = document.createElement('a');
    const file = new Blob([fullText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `エラー解析_${timestamp}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  const handleSubmit = () => {
    dispatch(setFeedbackAt(new Date()));
  };

  return (
    <div className={className}>
      <div className="mb-1 flex min-h-8 items-end justify-between">
        <Label className="text-base">エラー解析結果</Label>
        {!isEditing ? (
          <div className="flex items-center">
            <FeedbackGoodButton
              source="error-analysis"
              messageId={id}
              isSubmitted={!!feedbackAt}
              handleSubmit={handleSubmit}
            />
            <FeedbackBadButton
              source="error-analysis"
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
                  <p>エラー解析をダウンロード</p>
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
      <div className="flex h-full min-h-0 flex-col space-y-3">
        {/* エラーの説明エリア */}
        <div className="flex shrink-0 flex-col">
          <div className="mb-1 flex min-h-8 items-end justify-between">
            <Label className="text-base">エラーの説明</Label>
          </div>
          <div className="relative">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="icon"
                    size="icon"
                    onClick={copyExplanation}
                    className="absolute right-1 top-1 z-10"
                  >
                    <SvgCopy className="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>コピー</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {isEditing ? (
              <Textarea
                value={preEditContent.explanation}
                onChange={(e) =>
                  setPreEditContent((prev) => ({ ...prev, explanation: e.target.value }))
                }
                placeholder="ここに生成されたエラーの説明が表示されます"
                className="min-h-[150px]"
              />
            ) : (
              <ScrollArea className="h-[150px] rounded-lg border border-neutral-100 bg-neutral-0 p-3">
                <div className="prose max-w-none break-words">
                  <Markdown>
                    {result.explanation || 'ここに生成されたエラーの説明が表示されます'}
                  </Markdown>
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* 解決策と修正例エリア */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="mb-1 flex min-h-8 shrink-0 items-end justify-between">
            <Label className="text-base">解決策と修正例</Label>
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="icon"
                    size="icon"
                    onClick={copySolution}
                    className="absolute right-1 top-1 z-10"
                  >
                    <SvgCopy className="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>コピー</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {isEditing ? (
              <Textarea
                value={preEditContent.solutionAndExample}
                onChange={(e) =>
                  setPreEditContent((prev) => ({ ...prev, solutionAndExample: e.target.value }))
                }
                placeholder="ここに生成された解決策と修正例が表示されます"
                className="h-full min-h-[200px]"
              />
            ) : (
              <ScrollArea className="h-full rounded-lg border border-neutral-100 bg-neutral-0 p-3">
                <div className="prose max-w-none break-words">
                  <Markdown>
                    {result.solutionAndExample || 'ここに生成された解決策と修正例が表示されます'}
                  </Markdown>
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
