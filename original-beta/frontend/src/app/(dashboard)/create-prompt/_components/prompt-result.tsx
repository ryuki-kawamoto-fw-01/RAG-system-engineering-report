import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import SvgCopy from '@/app/_components/icon/button/Copy';
import { Button } from '@/app/_components/ui/button';
import { Label } from '@/app/_components/ui/label';
import { Textarea } from '@/app/_components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/_components/ui/tooltip';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setResult } from '@/app/_store/slice/create-prompt';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import type { FixPromptSchema } from '../_utils/schema';
import ActionButtons from './action-buttons';
import ModifyPromptForm from './modify-prompt-form';

type Props = {
  className?: string;
  onSubmit: (data: FixPromptSchema) => Promise<void>;
};

export function PromptResult({ className, onSubmit }: Props) {
  const dispatch = useAppDispatch();
  const { result, feedbackAt } = useAppSelector((state) => state.createPrompt);

  const [isEditing, setIsEditing] = useState(false);
  const [resultEditPrompt, setResultEditPrompt] = useState(result);

  useEffect(() => {
    setResultEditPrompt(result);
  }, [result]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setResultEditPrompt(result);
    setIsEditing(false);
  };

  const handleSave = () => {
    dispatch(setResult({ result: resultEditPrompt, feedbackAt }));
    setIsEditing(false);
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(resultEditPrompt);
    toast.success(getMessage('I_F_00050', '作成結果'));
  };

  return (
    <div className={cn('h-full relative', className)}>
      <div className="h-full overflow-y-auto">
        <div className="h-[calc(100%+48px)]">
          <div className="flex h-[calc((100%-48px)*4/5)] flex-col">
            <div className="mb-1 flex min-h-8 items-end justify-between">
              <Label className="text-base">作成結果</Label>
              <ActionButtons
                isEditing={isEditing}
                handleEdit={handleEdit}
                handleCancel={handleCancel}
                handleSave={handleSave}
              />
            </div>
            <div className="relative mb-3 flex-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="icon"
                      size="icon"
                      onClick={copyMessage}
                      className="absolute right-1 top-1 z-10"
                    >
                      <SvgCopy className="size-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>コピー</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Textarea
                outerClass="h-full"
                value={resultEditPrompt}
                className="h-full flex-1"
                readOnly={!isEditing}
                onChange={(e) => setResultEditPrompt(e.target.value)}
              />
            </div>
          </div>
          <ModifyPromptForm onSubmit={onSubmit} className="h-[calc((100%-48px)/5)]" />
        </div>
      </div>
    </div>
  );
}
