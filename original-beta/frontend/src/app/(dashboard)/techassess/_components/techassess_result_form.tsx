import { useRef, useEffect, useState } from 'react';
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
import { selectTechassess } from '@/app/_store/selectors/techassess';
import { setTechassessResult, setTechassessFeedbackAt } from '@/app/_store/slice/techassess';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';

type Props = {
  className?: string;
};

export default function TechassessResultDisplay({ className }: Props) {
  const dispatch = useAppDispatch();
  const {
    techassessResult = '',
    techassessId = '',
    techassessFeedbackAt,
  } = useAppSelector(selectTechassess) ?? {};
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [preEditContent, setPreEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setPreEditContent(techassessResult);
  }, [techassessResult]);

  const handleCopy = async () => {
    if (techassessResult) {
      await navigator.clipboard.writeText(techassessResult);
      toast.success(getMessage('I_F_00050', '技術評価レポート'));
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setPreEditContent(techassessResult);
    setIsEditing(false);
  };

  const handleSave = () => {
    dispatch(setTechassessResult(preEditContent));
    setIsEditing(false);
  };

  const handleSubmit = () => {
    dispatch(setTechassessFeedbackAt(new Date()));
  };

  const handleDownload = () => {
    if (!techassessResult) return;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${year}${month}${day}_${hours}${minutes}`;
    const element = document.createElement('a');
    const file = new Blob([techassessResult], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `技術評価レポート_${timestamp}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success(getMessage('I_F_00040', '技術評価レポート'));
  };

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="mb-1 flex min-h-8 items-end justify-between">
        <Label className="text-base">技術評価結果</Label>
        {!isEditing ? (
          <div className="flex items-center">
            <FeedbackGoodButton
              source="techassess"
              messageId={techassessId}
              isSubmitted={!!techassessFeedbackAt}
              handleSubmit={handleSubmit}
            />
            <FeedbackBadButton
              source="techassess"
              messageId={techassessId}
              isSubmitted={!!techassessFeedbackAt}
              handleSubmit={handleSubmit}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="icon" size="icon" onClick={handleDownload}>
                    <SvgDownload className="size-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>技術評価レポートをダウンロード</p>
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
                onClick={handleCopy}
                className="absolute right-1 top-1 z-10"
              >
                <SvgCopy className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>コピー</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Textarea
          ref={textRef}
          value={isEditing ? preEditContent : techassessResult}
          onChange={(e) => setPreEditContent(e.target.value)}
          placeholder="ここに生成された技術評価レポートが表示されます"
          readOnly={!isEditing}
          className="h-full"
        />
      </div>
    </div>
  );
}
