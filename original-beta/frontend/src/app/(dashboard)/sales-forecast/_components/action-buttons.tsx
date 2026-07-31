import SvgClose from '@/app/_components/icon/button/Close';
import SvgDownload from '@/app/_components/icon/button/Download';
import SvgEdit from '@/app/_components/icon/button/Edit';
import SvgSave from '@/app/_components/icon/button/Save';
import { Label } from '@/app/_components/ui/label';
import FeedbackBadButton from '@/app/_components/usecase/feedback-bad-button';
import FeedbackGoodButton from '@/app/_components/usecase/feedback-good-button';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setFeedbackAt } from '@/app/_store/slice/sales-forecast';
import { Button } from '../../../_components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../_components/ui/tooltip';

type Props = {
  isEditing: boolean;
  handleEdit: () => void;
  handleCancel: () => void;
  handleSave: () => void;
  preEditContent: string;
};

export default function ActionButtons({
  isEditing,
  handleEdit,
  handleCancel,
  handleSave,
  preEditContent,
}: Props): JSX.Element {
  const { feedbackAt, id } = useAppSelector((state) => state.salesForecast);
  const dispatch = useAppDispatch();

  function downloadMessage() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${year}${month}${day}_${hours}${minutes}`;
    const element = document.createElement('a');
    const file = new Blob([preEditContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `販売予測分析_${timestamp}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
  const handleSubmit = () => {
    dispatch(setFeedbackAt(new Date()));
  };
  return (
    <div className="flex min-h-8 items-end justify-between">
      <Label className="text-base">作成結果</Label>
      {!isEditing ? (
        <div className="flex items-center">
          <FeedbackGoodButton
            source="salesForecast"
            messageId={id}
            isSubmitted={!!feedbackAt}
            handleSubmit={handleSubmit}
          />
          <FeedbackBadButton
            source="salesForecast"
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
                <p>作成結果をダウンロード</p>
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
  );
}
