import { useEffect, useState } from 'react';
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
import FeedbackBadButton from '@/app/_components/usecase/feedback-bad-button';
import FeedbackGoodButton from '@/app/_components/usecase/feedback-good-button';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setResult, setFeedbackAt } from '@/app/_store/slice/quality-report';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';

interface Props {
  className?: string;
}

export default function QualityReportResultArea({ className }: Props) {
  const dispatch = useAppDispatch();
  const { result, id, feedbackAt } = useAppSelector((state) => state.qualityReport);
  const [preEditContent, setPreEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setPreEditContent(result);
  }, [result]);

  const copyResult = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    navigator.clipboard.writeText(result);
    toast.success(getMessage('I_F_00050', '品質管理レポート'));
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
    const element = document.createElement('a');
    const file = new Blob([result], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `品質管理レポート_${new Date().toLocaleDateString('ja-JP')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  const handleSubmit = () => {
    dispatch(setFeedbackAt(new Date()));
  };

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="mb-1 flex min-h-8 items-end justify-between">
        <Label className="text-base">品質管理レポート</Label>
        {!isEditing ? (
          <div className="flex items-center">
            <FeedbackGoodButton
              source="qualityReport"
              messageId={id}
              isSubmitted={!!feedbackAt}
              handleSubmit={handleSubmit}
            />
            <FeedbackBadButton
              source="qualityReport"
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
                  <p>品質管理レポートをダウンロード</p>
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
                className="absolute right-1 top-1 z-10"
              >
                <SvgCopy className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>コピー</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Textarea
          onChange={(e) => {
            setPreEditContent(e.target.value);
          }}
          value={preEditContent}
          placeholder="ここに生成された品質管理レポートが表示されます"
          readOnly={!isEditing}
          className="h-full resize-none leading-relaxed"
          outerClass="h-[calc(100%-30px-8px)]"
        />
      </div>
    </div>
  );
}
