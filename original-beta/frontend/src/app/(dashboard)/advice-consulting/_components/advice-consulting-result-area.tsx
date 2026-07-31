import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import SvgClose from '@/app/_components/icon/button/Close';
import SvgCopy from '@/app/_components/icon/button/Copy';
import SvgDownload from '@/app/_components/icon/button/Download';
import SvgEdit from '@/app/_components/icon/button/Edit';
import SvgSave from '@/app/_components/icon/button/Save';
import { Button } from '@/app/_components/ui/button';
import { Label } from '@/app/_components/ui/label';
import Markdown from '@/app/_components/ui/markdown';
import { ScrollArea } from '@/app/_components/ui/scroll-area';
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
import { setResult, setFeedbackAt } from '@/app/_store/slice/advice-consulting';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';

type Props = {
  className?: string;
};

export default function AdviceConsultingResultArea({ className }: Props) {
  const dispatch = useAppDispatch();
  const { result, id, feedbackAt } = useAppSelector((state) => state.adviceConsulting);
  const [preEditContent, setPreEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setPreEditContent(result);
  }, [result]);

  const copyResult = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    navigator.clipboard.writeText(result);
    toast.success(getMessage('I_F_00050', 'アドバイス結果'));
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
    element.download = `アドバイス(コンサルティング)_${timestamp}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success(getMessage('I_F_00060'));
  }

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

  const handleSubmit = () => {
    dispatch(setFeedbackAt(new Date()));
  };

  if (!result) {
    return (
      <div className={cn('flex h-full w-full items-center justify-center', className)}>
        <p className="text-muted-foreground">
          左の入力フォームから役割、制約、相談内容を入力して、アドバイスを作成してください。
        </p>
      </div>
    );
  }

  return (
    <div className={cn('size-full', className)}>
      <div className="mb-1 flex items-center justify-between">
        <Label className="text-base">アドバイス結果</Label>
        {!isEditing ? (
          <div className="flex items-center">
            <FeedbackGoodButton
              source="adviceConsulting"
              messageId={id}
              isSubmitted={!!feedbackAt}
              handleSubmit={handleSubmit}
            />
            <FeedbackBadButton
              source="adviceConsulting"
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
                  <p>アドバイス(コンサルティング)をダウンロード</p>
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
        {isEditing ? (
          <Textarea
            onChange={(e) => setPreEditContent(e.target.value)}
            value={preEditContent}
            placeholder="ここに生成したアドバイスが表示されます"
            readOnly={false}
            className="h-full"
          />
        ) : (
          <ScrollArea className="h-full rounded-lg border bg-white px-4 py-2 shadow">
            {result ? (
              <Markdown>{result.replace(/<\/?b>/g, '**').replace(/\\n/g, '\n')}</Markdown>
            ) : (
              <span className="text-base text-gray-400">
                ここに生成したアドバイスが表示されます
              </span>
            )}
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
