'use client';

import { useEffect, useRef } from 'react';
import { Components } from 'react-markdown';
import ChatMessage from '@/app/_components/chat/chat-message';
import { formatDate } from '@/app/_utils/date';
import { cn } from '@/app/_utils/tw-merge';
import { ScrollArea } from '../ui/scroll-area';
import AssistantMessageSkeleton from './assistant-message-skeleton';

type Citation = {
  rawdata_name: string;
  rawdata_path: string;
  pagedata_path: string;
};

type RefItem = {
  text: string;
  citation: Citation[];
};

// TODO: Messageの方がいろんなところに散らばってしまっているのでリファクタリングしたい
export type Message = {
  id: string;
  role: string;
  content: string;
  createdAt?: Date;
  feedbackAt?: Date;
  citation?: string;
  searchResults?: Array<{ id: number; title: string; url: string; snippet: string }>;
  refAns?: RefItem[];
  file_name?: string;
  file_content?: string;
  seasonalEvent?: string;
};

type Props = {
  source?: 'chat' | 'rag' | 'agent';
  messages: Message[];
  isLoading: boolean;
  markdownComponents?: Components;
  feedbackEnabled?: boolean;
  className?: string;
  recommend?: string[];
  onRecommendClick?: (text: string) => void;
};

export default function ChatMessageList({
  source = 'chat',
  messages,
  isLoading,
  markdownComponents,
  feedbackEnabled = true,
  className,
  recommend,
  onRecommendClick,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [messages]);

  const lastAssistantIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return i;
    }
    return -1;
  })();

  return (
    <ScrollArea className={cn('w-full', className)}>
      <div className="flex flex-col gap-y-3.5">
        {messages.map((message, index) => {
          let currentDate, previousDate;
          if (message.createdAt) {
            const format = 'YYYY/MM/DD (ddd)';
            currentDate = formatDate(message.createdAt, format);
            previousDate = formatDate(messages[index - 1]?.createdAt ?? '', format);
          }

          return (
            <div key={message.id} className="space-y-3.5">
              {currentDate && currentDate !== previousDate && (
                <div className="flex justify-center">
                  <span className="h-5 rounded-full bg-white px-2.5 text-2xs text-neutral-500">
                    {currentDate}
                  </span>
                </div>
              )}
              <ChatMessage
                source={source}
                message={message}
                markdownComponents={markdownComponents}
                feedbackEnabled={feedbackEnabled}
                className={cn(message.role === 'user' && 'justify-end')}
              />
              {index === lastAssistantIdx && recommend && recommend.length > 0 && (
                <div className="flex justify-end">
                  <div className="my-2 flex max-w-[70%] flex-col gap-2 self-end">
                    {recommend.map((rec, i) => (
                      <button
                        key={i}
                        type="button"
                        className="rounded border border-blue-200 bg-blue-100 px-3 py-1 text-left text-lg text-blue-800 hover:bg-blue-200"
                        onClick={() => onRecommendClick && onRecommendClick(rec)}
                      >
                        {rec}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {isLoading && <AssistantMessageSkeleton />}

        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  );
}
