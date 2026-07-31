import { useRef, useEffect } from 'react';
import { toast } from 'sonner';
import AssistantAvatar from '@/app/_components/chat/assistant-avatar';
import FeedbackBadButton from '@/app/_components/chat/feedback-bad-button';
import FeedbackGoodButton from '@/app/_components/chat/feedback-good-button';
import SvgCopy from '@/app/_components/icon/button/Copy';
import SvgDownload from '@/app/_components/icon/button/Download';
import { Button } from '@/app/_components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/_components/ui/tooltip';
import { formatDate } from '@/app/_utils/date';
import { cn } from '@/app/_utils/tw-merge';
import { Message } from '../../_utils/schema';
import { VoiceInput } from './voice-input';

interface ChatPanelProps {
  isRecording: boolean;
  messages: Message[];
  threadId: string;
  fetchMessages: () => Promise<void>;
  onToggleRecording: () => Promise<void>;
}

export function ChatPanel({
  isRecording,
  messages,
  threadId,
  fetchMessages,
  onToggleRecording,
}: ChatPanelProps) {
  // 入力メッセージの状態管理
  const messageContainerRef = useRef<HTMLDivElement>(null);

  const lastFeedbackEventRef = useRef<number>(0);

  // フィードバック完了を検知
  useEffect(() => {
    const handleFeedbackSubmitted = () => {
      const currentTime = Date.now();
      if (currentTime - lastFeedbackEventRef.current < 500) {
        return;
      }
      lastFeedbackEventRef.current = currentTime;
      fetchMessages();
    };
    window.addEventListener('feedback-submitted', handleFeedbackSubmitted);

    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (
          (mutation.type === 'childList' &&
            mutation.addedNodes.length > 0 &&
            Array.from(mutation.addedNodes).some((node) =>
              (node as HTMLElement).innerText?.includes('フィードバックを送信しました')
            )) ||
          (mutation.type === 'attributes' &&
            mutation.attributeName === 'data-state' &&
            (mutation.target as HTMLElement).getAttribute('data-state') === 'closed' &&
            document.querySelector('[role="dialog"]') === null)
        ) {
          setTimeout(handleFeedbackSubmitted, 500);
          break;
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => {
      window.removeEventListener('feedback-submitted', handleFeedbackSubmitted);
      observer.disconnect();
    };
  }, [threadId, fetchMessages]);

  // メッセージが追加されたら自動スクロール
  const scrollToBottom = () => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex size-full flex-col">
      <div className="flex-1 overflow-y-auto px-6 pb-16" ref={messageContainerRef}>
        {messages.length > 0 ? (
          <div className="my-4 flex h-fit flex-col gap-4">
            {messages.map((message, index) => {
              const isUserMessage = message.role === 'user';

              let currentDate, previousDate;
              if (message.createdAt) {
                const format = 'YYYY/MM/DD (ddd)';
                currentDate = formatDate(message.createdAt, format);
                previousDate = formatDate(messages[index - 1]?.createdAt ?? '', format);
              }

              return (
                <div key={index}>
                  {currentDate && currentDate !== previousDate && (
                    <div className="mb-4 flex justify-center">
                      <span className="h-5 rounded-full bg-white px-2.5 text-2xs text-neutral-500">
                        {currentDate}
                      </span>
                    </div>
                  )}
                  <div className={cn('flex gap-x-2', isUserMessage && 'justify-end')}>
                    {!isUserMessage && <AssistantAvatar />}
                    <div
                      data-role={message.role}
                      className={cn(
                        'rounded-xl pt-2.5 pb-2 px-3.5 font-normal text-lg max-w-screen-sm',
                        isUserMessage ? 'bg-sky-100 min-w-14' : 'bg-white min-w-44'
                      )}
                    >
                      {message.content}
                      {message.createdAt && (
                        <div
                          className={cn(
                            'flex h-[18px] items-center justify-between gap-x-2 mt-1.5',
                            isUserMessage && 'justify-end'
                          )}
                        >
                          {!isUserMessage && (
                            <div className="flex items-center gap-x-3">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="icon"
                                      size="icon-sm"
                                      onClick={() => {
                                        navigator.clipboard.writeText(message.content);
                                        toast.success('メッセージをクリップボードにコピーしました');
                                      }}
                                    >
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
                                    <Button
                                      variant="icon"
                                      size="icon-sm"
                                      onClick={() => {
                                        const now = new Date();
                                        const year = now.getFullYear();
                                        const month = String(now.getMonth() + 1).padStart(2, '0');
                                        const day = String(now.getDate()).padStart(2, '0');
                                        const hours = String(now.getHours()).padStart(2, '0');
                                        const minutes = String(now.getMinutes()).padStart(2, '0');
                                        const timestamp = `${year}${month}${day}_${hours}${minutes}`;
                                        const element = document.createElement('a');
                                        const file = new Blob([message.content], {
                                          type: 'text/plain',
                                        });
                                        element.href = URL.createObjectURL(file);
                                        element.download = `会話履歴_${timestamp}.txt`;
                                        document.body.appendChild(element);
                                        element.click();
                                        document.body.removeChild(element);
                                      }}
                                    >
                                      <SvgDownload className="size-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>会話履歴をダウンロード</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <FeedbackGoodButton
                                source="voice"
                                messageId={message.id}
                                isSubmitted={!!message.feedbackAt}
                              />
                              <FeedbackBadButton
                                source="voice"
                                messageId={message.id}
                                isSubmitted={!!message.feedbackAt}
                              />
                            </div>
                          )}
                          <div className={cn('text-2xs text-neutral-500')}>
                            {message.createdAt ? formatDate(message.createdAt, 'HH:mm') : ''}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="sticky inset-x-0 bottom-2 z-10 flex justify-center bg-transparent">
        <VoiceInput
          threadId={threadId}
          isRecording={isRecording}
          onToggleRecording={onToggleRecording}
        />
      </div>
    </div>
  );
}
