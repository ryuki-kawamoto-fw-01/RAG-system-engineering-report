'use client';

import SvgClose from '@/app/_components/icon/button/Close';
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
import { setFeedbackAt } from '@/app/_store/slice/product-aarrr';

interface Props {
  isEditing?: boolean;
  handleEdit?: () => void;
  handleCancel?: () => void;
  handleSave?: () => void;
}

export default function ActionButtons({
  isEditing = false,
  handleEdit,
  handleCancel,
  handleSave,
}: Props) {
  const dispatch = useAppDispatch();
  const { id, feedbackAt } = useAppSelector((state) => state.productAARRR);

  const handleSubmit = () => {
    dispatch(setFeedbackAt(new Date()));
  };

  return (
    <>
      {!isEditing ? (
        <div className="flex items-center">
          <FeedbackGoodButton
            source="product-aarrr"
            messageId={id}
            isSubmitted={!!feedbackAt}
            handleSubmit={handleSubmit}
          />
          <FeedbackBadButton
            source="product-aarrr"
            messageId={id}
            isSubmitted={!!feedbackAt}
            handleSubmit={handleSubmit}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="icon"
                  size="icon"
                  onClick={handleEdit}
                  disabled={!id}
                >
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
    </>
  );
}
