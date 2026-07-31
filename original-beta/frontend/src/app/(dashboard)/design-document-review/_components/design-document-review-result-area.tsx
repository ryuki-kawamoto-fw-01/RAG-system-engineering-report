import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import SvgClose from '@/app/_components/icon/button/Close';
import SvgCopy from '@/app/_components/icon/button/Copy';
import SvgDownload from '@/app/_components/icon/button/Download';
import SvgEdit from '@/app/_components/icon/button/Edit';
import SvgSave from '@/app/_components/icon/button/Save';
import { Label } from '@/app/_components/ui/label';
import { Textarea } from '@/app/_components/ui/textarea';
import FeedbackBadButton from '@/app/_components/usecase/feedback-bad-button';
import FeedbackGoodButton from '@/app/_components/usecase/feedback-good-button';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setFeedbackAt, setResult } from '@/app/_store/slice/design-document-review';
import { getMessage } from '@/app/_utils/message';
import { Button } from '../../../_components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../_components/ui/tooltip';

type Props = {
  className?: string;
};

export default function DesignDocumentReviewResultArea({ className }: Props): JSX.Element {
  const { result, feedbackAt, id } = useAppSelector((state) => state.designDocumentReview);
  const [isEditing, setIsEditing] = useState(false);
  const [editingResult, setEditingResult] = useState('');

  useEffect(() => {
    setEditingResult(result ?? '');
  }, [result]);

  const dispatch = useAppDispatch();

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingResult(result);
  };

  const handleSave = () => {
    setIsEditing(false);
    dispatch(setResult({ result: editingResult, feedbackAt }));
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
    element.download = `設計書のレビュー_${timestamp}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
  const copyResult = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    navigator.clipboard.writeText(result);
    toast.success(getMessage('I_F_00050', 'フィードバック結果'));
  };
  const handleSubmit = () => {
    dispatch(setFeedbackAt(new Date()));
  };
  return (
    <div className={className}>
      <div className="mb-1 flex min-h-8 items-end justify-between">
        <Label className="text-base">フィードバック結果</Label>
        {!isEditing ? (
          <div className="flex items-center">
            <FeedbackGoodButton
              source="design-document-review"
              messageId={id}
              isSubmitted={!!feedbackAt}
              handleSubmit={handleSubmit}
            />
            <FeedbackBadButton
              source="design-document-review"
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
                  <p>フィードバック結果をダウンロード</p>
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
                  <Button type="button" variant="tertiary" size="sm" onClick={handleCancelEdit}>
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
            setEditingResult(e.target.value);
          }}
          value={editingResult}
          placeholder="ここに生成されたフィードバック結果が表示されます"
          readOnly={!isEditing}
          className="h-full min-h-[350px]"
        />
      </div>
    </div>
  );
}
