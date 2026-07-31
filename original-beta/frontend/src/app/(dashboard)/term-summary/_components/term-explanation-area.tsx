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
import { setTermExplanation } from '@/app/_store/slice/term-summary';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import ActionButtons from './action-buttons';

type Props = {
  className?: string;
};

export default function TermExplanation({ className }: Props) {
  const dispatch = useAppDispatch();
  const { termExplanation } = useAppSelector((state) => state.termSummary);

  const [isEditing, setIsEditing] = useState(false);
  const [resultEditTermExplanation, setResultEditTermExplanation] = useState(termExplanation);

  useEffect(() => {
    setResultEditTermExplanation(termExplanation);
  }, [termExplanation]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(termExplanation);
    toast.success(getMessage('I_F_00050', '用語解説'));
  };

  const handleSave = () => {
    dispatch(setTermExplanation(resultEditTermExplanation));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setResultEditTermExplanation(termExplanation);
    setIsEditing(false);
  };

  return (
    <div className={cn('flex h-1/2 flex-col relative', className)}>
      <div className="mb-1 flex min-h-8 items-end justify-between">
        <Label className="text-base">用語解説</Label>
        <ActionButtons
          isEditing={isEditing}
          handleEdit={handleEdit}
          handleCancel={handleCancel}
          handleSave={handleSave}
          report={resultEditTermExplanation}
          filename="term_explanation.txt"
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
          value={resultEditTermExplanation}
          placeholder="ここに専門用語の解説が表示されます"
          readOnly={!isEditing}
          onChange={(e) => setResultEditTermExplanation(e.target.value)}
        />
      </div>
    </div>
  );
}
