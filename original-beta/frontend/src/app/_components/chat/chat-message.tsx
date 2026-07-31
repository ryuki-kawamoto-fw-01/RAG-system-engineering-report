'use client';

import { Components } from 'react-markdown';
import { toast } from 'sonner';
import AssistantAvatar from '@/app/_components/chat/assistant-avatar';
import { Message } from '@/app/_components/chat/chat-message-list';
import SvgCopy from '@/app/_components/icon/button/Copy';
import SvgDownload from '@/app/_components/icon/button/Download';
import ImageModal from '@/app/_components/ui/image-modal';
import Markdown from '@/app/_components/ui/markdown';
import TextLink from '@/app/_components/ui/text-link';
// import { seasonalEvents } from '@/app/_constants/seasonal-event';
import { formatDate } from '@/app/_utils/date';
import { getMessage } from '@/app/_utils/message';
import { cn } from '../../_utils/tw-merge';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import FeedbackBadButton from './feedback-bad-button';
import FeedbackGoodButton from './feedback-good-button';

// 画像のMIMEタイプを取得する関数
function getMimeType(fileName?: string) {
  if (!fileName) return 'png';
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'jpeg';
    case 'png':
      return 'png';
    case 'gif':
      return 'gif';
    case 'webp':
      return 'webp';
    default:
      return 'png';
  }
}

type Props = {
  source?: 'chat' | 'rag' | 'agent';
  message: Message;
  markdownComponents?: Components;
  feedbackEnabled?: boolean;
  className?: string;
};

export default function ChatMessage({
  source = 'chat',
  message,
  markdownComponents,
  feedbackEnabled = true,
  className = '',
}: Props) {
  const isUserMessage = message.role === 'user';

  function copyMessage() {
    navigator.clipboard.writeText(message.content);
    toast.success(getMessage('I_F_00050', 'メッセージ'));
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
    toast.success(getMessage('I_F_00060'));
  }

  return (
    <div className={cn('flex gap-x-2', className)}>
      {!isUserMessage && <AssistantAvatar />}
      <div
        className={cn(
          'rounded-xl py-3 px-5 font-normal text-lg max-w-screen-sm break-words',
          isUserMessage ? 'bg-sky-100 min-w-14' : 'bg-white min-w-44'
        )}
      >
        {message.seasonalEvent ? (
          <div>
            <div>{message.content}</div>
            {/* トライアル環境なので修正 */}
            {/* {(() => {
              const event = seasonalEvents.find((e) => e.name === message.seasonalEvent);
              return event ? (
                <img
                  src={event.chat.image}
                  alt={event.chat.content}
                  className="my-[18px] size-52 object-contain"
                />
              ) : null;
            })()} */}
          </div>
        ) : (
          <Markdown customComponents={markdownComponents} className="text-justify">
            {message.content}
          </Markdown>
        )}
        {/* 画像がある場合は表示 */}
        {!isUserMessage && message.file_name && message.file_content && (
          <div className="ml-3 mt-3">
            <ImageModal
              src={`data:image/${getMimeType(message.file_name)};base64,${message.file_content}`}
              alt="Uploaded Image"
              className="max-w-xs rounded"
            />
          </div>
        )}
        {!isUserMessage && message.searchResults && message.searchResults.length > 0 && (
          <div>
            <div>引用元：</div>
            <ul className="ml-4 mt-0.5 list-outside list-disc">
              {message.searchResults.map((result) => (
                <li key={result.id} className="mt-1">
                  <TextLink href={result.url} target="_blank">
                    {result.title}
                  </TextLink>
                </li>
              ))}
            </ul>
          </div>
        )}
        {message.createdAt && (
          <div
            className={cn(
              'flex h-[18px] items-center justify-between gap-x-2 mt-2',
              isUserMessage && 'justify-end'
            )}
          >
            {!isUserMessage && (
              <div className="flex items-center gap-x-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="icon" size="icon-sm" onClick={copyMessage}>
                        <SvgCopy className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>コピー</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="icon" size="icon-sm" onClick={downloadMessage}>
                        <SvgDownload className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>会話履歴をダウンロード</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {feedbackEnabled && (
                  <>
                    <FeedbackGoodButton
                      source={source}
                      messageId={message.id}
                      isSubmitted={!!message.feedbackAt}
                    />
                    <FeedbackBadButton
                      source={source}
                      messageId={message.id}
                      isSubmitted={!!message.feedbackAt}
                    />
                  </>
                )}
              </div>
            )}
            <div className={cn('text-2xs text-neutral-500')}>
              {message.createdAt ? formatDate(message.createdAt, 'HH:mm') : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
