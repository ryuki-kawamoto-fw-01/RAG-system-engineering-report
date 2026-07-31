'use client';

import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import SvgCopy from '@/app/_components/icon/button/Copy';
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
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setResult } from '@/app/_store/slice/product-aarrr';
import { getMessage } from '@/app/_utils/message';
import ActionButtons from './action-buttons';

export default function ResultDisplay({ className }: { className?: string }) {
  const dispatch = useAppDispatch();
  const { result, feedbackAt } = useAppSelector((state) => state.productAARRR);

  const [isEditing, setIsEditing] = useState(false);
  const [resultEditText, setResultEditText] = useState(result);
  const markdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setResultEditText(result);
  }, [result]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resultEditText);
    toast.success(getMessage('I_F_00050', 'AARRR分析結果'));
  };

  const handleSave = () => {
    dispatch(setResult({ result: resultEditText, feedbackAt }));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setResultEditText(result);
    setIsEditing(false);
  };

  return (
    <div className={className}>
      <div className="mb-1 flex min-h-8 items-end justify-between">
        <Label className="text-base">AARRRモデル分析結果</Label>
        <ActionButtons
          isEditing={isEditing}
          handleEdit={handleEdit}
          handleCancel={handleCancel}
          handleSave={handleSave}
        />
      </div>
      <div className="relative h-[calc(100%-2.5rem)]">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="icon"
                onClick={handleCopy}
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
            className="h-full resize-none"
            placeholder="ここに生成されたAARRR分析結果が表示されます"
            value={resultEditText}
            onChange={(e) => setResultEditText(e.target.value)}
          />
        ) : (
          <ScrollArea className="size-full rounded-lg border bg-white px-4 py-2 shadow">
            <div ref={markdownRef}>
              {resultEditText ? (
                <Markdown>{resultEditText}</Markdown>
              ) : (
                <span className="text-base text-gray-400">
                  ここに生成されたAARRR分析結果が表示されます
                </span>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
