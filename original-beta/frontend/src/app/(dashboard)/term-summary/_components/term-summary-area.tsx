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
import { setTermSummaryResult } from '@/app/_store/slice/term-summary';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import ActionButtons from './action-buttons';

type Props = {
  className?: string;
};

export default function SummaryResult({ className }: Props) {
  const dispatch = useAppDispatch();
  const { termSummaryResult } = useAppSelector((state) => state.termSummary);
  const [isEditing, setIsEditing] = useState(false);
  const [resultEditTermSummary, setResultEditTermSummary] = useState(termSummaryResult);
  useEffect(() => {
    setResultEditTermSummary(termSummaryResult);
  }, [termSummaryResult]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(termSummaryResult);
    toast.success(getMessage('I_F_00050', '要約結果'));
  };

  const handleSave = () => {
    dispatch(setTermSummaryResult(resultEditTermSummary));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setResultEditTermSummary(termSummaryResult);
    setIsEditing(false);
  };

  return (
    <div className={cn('flex h-1/2 flex-col relative', className)}>
      <div className="mb-1 flex min-h-8 items-end justify-between">
        <Label className="text-base">要約結果</Label>
        <ActionButtons
          isEditing={isEditing}
          handleEdit={handleEdit}
          handleCancel={handleCancel}
          handleSave={handleSave}
          report={termSummaryResult}
          filename="summary.txt"
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
          className="h-full resize-none pr-6"
          value={resultEditTermSummary}
          placeholder="ここに生成された要約が表示されます"
          readOnly={!isEditing}
          onChange={(e) => setResultEditTermSummary(e.target.value)}
        />
      </div>
    </div>
  );
}
