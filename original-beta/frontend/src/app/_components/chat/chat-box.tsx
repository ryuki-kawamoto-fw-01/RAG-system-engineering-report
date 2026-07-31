'use client';

import { Tooltip } from '@radix-ui/react-tooltip';
import React, { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { FileList } from '@/app/(dashboard)/chat/[id]/_components/chat-utils';
import { useMediaQuery } from '@/app/_hooks/use-media-query';
import { cn } from '@/app/_utils/tw-merge';
import SvgAttachment from '../icon/button/Attachment';
import SvgSend from '../icon/button/Send';
import SvgSendPause from '../icon/button/SendPause';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import AttachmentList from './attachment-list';

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  isLoading?: boolean;
  isDisabled?: boolean;
  files?: FileList;
  handleFileClick?: () => void;
  handleFileDelete?: () => void;
  attachmentTooltip?: string;
  className?: string;
};
const INITIAL_TEXTAREA_HEIGHT = 24;

export default function ChatBox({
  isLoading = false,
  isDisabled = false,
  files = [],
  handleFileClick,
  handleFileDelete,
  attachmentTooltip = `ファイル添付\n対応ファイル：.pdf .txt .csv .docx .xlsx .pptx .msg .jpeg .jpg .png\n（最大1ファイル/最大20MB/暗号化ファイル不可）`,
  className = '',
  ...props
}: Props) {
  const is2xl = useMediaQuery('2xl');
  const MAX_TEXTAREA_HEIGHT = is2xl ? 282 : 142;
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // 送信時にテキストエリアの高さをリセット
    if (textareaRef.current && isLoading) {
      textareaRef.current.style.height = `${INITIAL_TEXTAREA_HEIGHT}px`;
    }
  }, [isLoading]);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // アイコンクリック時はフォーカスしない
    if (event.target instanceof SVGElement) {
      return;
    }

    textareaRef.current?.focus();
  };

  const handleInput = () => {
    if (textareaRef.current) {
      const currentHeight = textareaRef.current.scrollHeight;

      if (currentHeight > INITIAL_TEXTAREA_HEIGHT) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(currentHeight, MAX_TEXTAREA_HEIGHT)}px`;
      }
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (isLoading || isDisabled) {
      return;
    }

    if (event.key === 'Enter') {
      if (event.shiftKey) {
        return;
      }

      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const handleFocus = () => {
    setFocused(true);
  };

  const handleBlur = () => {
    setFocused(false);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex cursor-text flex-col gap-y-2.5 rounded-[20px] border border-neutral-100 bg-white px-5 py-3 shadow-default',
        focused && 'shadow-focus',
        className
      )}
    >
      <Textarea
        ref={textareaRef}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(
          `h-[${INITIAL_TEXTAREA_HEIGHT}px]`,
          'min-h-0 resize-none border-none p-0 text-lg font-normal shadow-none focus-visible:ring-0'
        )}
        {...props}
      />
      <div
        className={cn('flex items-end justify-end gap-x-3', files.length > 0 && 'justify-between')}
      >
        {files.length > 0 && handleFileDelete && (
          <AttachmentList files={files} handleDelete={handleFileDelete} className="flex-1" />
        )}
        <div className="flex items-center gap-x-3">
          {handleFileClick && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="icon" size="icon" onClick={handleFileClick}>
                    <SvgAttachment className={cn(false && 'text-neutral-400')} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">{attachmentTooltip}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {isLoading ? (
            <Button type="button" variant="ghost" size="icon">
              <SvgSendPause />
            </Button>
          ) : (
            <Button type="submit" size="icon" disabled={isDisabled}>
              <SvgSend />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
