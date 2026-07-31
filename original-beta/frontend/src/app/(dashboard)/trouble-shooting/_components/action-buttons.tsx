import SvgClose from '@/app/_components/icon/button/Close';
import SvgDownload from '@/app/_components/icon/button/Download';
import SvgEdit from '@/app/_components/icon/button/Edit';
import SvgSave from '@/app/_components/icon/button/Save';
import { Button } from '@/app/_components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/_components/ui/tooltip';
import FeedbackBadButton from '@/app/_components/usecase/feedback-bad-button';
import FeedbackGoodButton from '@/app/_components/usecase/feedback-good-button';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setFeedbackAt } from '@/app/_store/slice/trouble-shooting';

type Props = {
  isEditing: boolean;
  handleEdit: () => void;
  handleCancel: () => void;
  handleSave: () => void;
  handleDownload: () => void;
};

export default function ActionButtons({
  isEditing,
  handleEdit,
  handleCancel,
  handleSave,
  handleDownload,
}: Props): JSX.Element {
  const { id, feedbackAt } = useAppSelector((state) => state.troubleShootingGuide);
  const dispatch = useAppDispatch();
  const handleSubmit = () => {
    dispatch(setFeedbackAt(new Date()));
  };
  return (
    <>
      {!isEditing ? (
        <div className="flex items-end justify-end space-x-2">
          <FeedbackGoodButton
            source="troubleShooting"
            messageId={id}
            isSubmitted={!!feedbackAt}
            handleSubmit={handleSubmit}
          />
          <FeedbackBadButton
            source="troubleShooting"
            messageId={id}
            isSubmitted={!!feedbackAt}
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
                <p>トラブルシューティングガイドをダウンロード</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="icon" size="icon" onClick={handleEdit}>
                  <SvgEdit className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>トラブルシューティングガイドを手動で編集</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ) : (
        <div className="flex items-end justify-end space-x-2">
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
    </>
  );
}
