'use client';

import React, { useEffect, useState } from 'react';
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
import { setResult } from '@/app/_store/slice/quality-standard-document';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import ActionButtons from './action-buttons';

type Props = {
  className?: string;
};

export default function QualityStandardDocumentResult({ className }: Props) {
  const dispatch = useAppDispatch();
  const { result, feedbackAt } = useAppSelector((state) => state.qualityStandardDocument);

  const [isEditing, setIsEditing] = useState(false);
  const [resultEditContent, setResultEditContent] = useState(result);

  useEffect(() => {
    setResultEditContent(result);
  }, [result]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast.success(getMessage('I_F_00050', '品質標準文書'));
  };

  const handleSave = () => {
    dispatch(setResult({ result: resultEditContent, feedbackAt }));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setResultEditContent(result);
    setIsEditing(false);
  };

  if (!result) {
    return null;
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="mb-1 flex min-h-8 items-end justify-between">
        <Label className="text-base">品質標準文書</Label>
        <ActionButtons
          isEditing={isEditing}
          handleEdit={handleEdit}
          handleCancel={handleCancel}
          handleSave={handleSave}
        />
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
          outerClass="h-full"
          className="h-full resize-none"
          name="result"
          value={isEditing ? resultEditContent : result}
          placeholder="ここに生成された品質標準文書が表示されます"
          readOnly={!isEditing}
          onChange={(e) => setResultEditContent(e.target.value)}
        />
      </div>
    </div>
  );
}
