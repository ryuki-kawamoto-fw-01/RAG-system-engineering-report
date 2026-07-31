'use client';

import { Copy, Download } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Markdown from '@/app/_components/ui/markdown';
import { formatDate } from '@/app/_utils/date';
import { assistantName } from '../../../../../../config';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../_components/ui/avatar';
import { Button } from '../../../../_components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../_components/ui/tooltip';
import { cn } from '../../../../_utils/tw-merge';
import { getMessage } from '../_actions/getChatMessage';
import FeedbackBadButton from './feedback-bad-button';
import FeedbackGoodButton from './feedback-good-button';

type Props = {
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  message: Message;
  threadId: string;
};

type Message = {
  id: string;
  role: string;
  content: string;
  createdAt?: Date;
  citation?: string;
  searchResults?: Array<{ id: number; title: string; url: string }>;
};

export default function ChatMessage({ user, message }: Props) {
  const outgoing = message.role === 'user';
  const avatarUrl = '/assistant.png';
  const name = outgoing ? user.name : assistantName;
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false);
  const messageId = message.id;

  useEffect(() => {
    const checkFeedbackStatus = async () => {
      try {
        const messageData = await getMessage(messageId);
        setIsFeedbackSubmitted(!!messageData?.feedbackAt);
      } catch (error) {
        console.error('Error fetching feedback status:', error);
      }
    };

    checkFeedbackStatus();
  }, [messageId]);

  const handleFeedbackSubmit = () => {
    setIsFeedbackSubmitted(true);
  };

  function copyMessage() {
    navigator.clipboard.writeText(message.content);
    toast.success('メッセージをクリップボードにコピーしました');
  }

  function downloadMessage() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${year}${month}${day}_${hours}${minutes}`;
    const element = document.createElement('a');
    const file = new Blob([message.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `会話履歴_${timestamp}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  return (
    <div className={cn('flex gap-x-3', outgoing && 'flex-row-reverse')}>
      {!outgoing && (
        <Avatar className="size-10">
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback>{name.at(0)}</AvatarFallback>
        </Avatar>
      )}
      <div className="max-w-[40rem]">
        <div className={cn('px-5 flex items-start gap-x-4', outgoing && 'justify-end')}>
          <div
            className={cn(
              'text-muted-foreground text-base font-semibold',
              outgoing ? 'text-right' : 'text-left'
            )}
          >
            {name}
          </div>
        </div>
        <div
          className={cn(
            'rounded-lg p-3 shadow mt-2',
            outgoing
              ? 'bg-primary-light dark:bg-primary-dark'
              : 'bg-assistant-light dark:bg-assistant-dark'
          )}
        >
          <div className="px-5 text-justify text-base leading-relaxed">
            <Markdown>{message.content}</Markdown>
          </div>
          {message.role === 'assistant' &&
            message.searchResults &&
            message.searchResults.length > 0 && (
              <div className="px-5">
                <h4 className="mb-2 mt-4 text-base font-semibold">引用元:</h4>
                <ul className="ml-4 list-outside list-disc">
                  {message.searchResults.map((result) => (
                    <li key="1" className="mt-1">
                      <Link
                        href={result.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-base font-semibold text-blue-500 hover:underline"
                      >
                        {result.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          {!outgoing && (
            <div className="mt-3 flex justify-start gap-x-2 px-5">
              <FeedbackGoodButton
                messageId={messageId}
                isSubmitted={isFeedbackSubmitted}
                onSubmit={handleFeedbackSubmit}
              />
              <FeedbackBadButton
                messageId={messageId}
                isSubmitted={isFeedbackSubmitted}
                onSubmit={handleFeedbackSubmit}
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" className="size-6 p-0" onClick={copyMessage}>
                      <Copy size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="dark:bg-dark-gray bg-gray-100 text-black dark:text-white">
                    <p>コピー</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" className="size-6 p-0" onClick={downloadMessage}>
                      <Download size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="dark:bg-dark-gray bg-gray-100 text-black dark:text-white">
                    <p>会話履歴をダウンロード</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
        <div className={cn('text-xs text-gray-500 h-4 mt-2 text-right', outgoing && 'text-left')}>
          {message.createdAt ? formatDate(message.createdAt, 'MM/DD HH:mm') : ''}
        </div>
      </div>
    </div>
  );
}
