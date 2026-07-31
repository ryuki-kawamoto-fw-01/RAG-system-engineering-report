'use client';

import { type Message, useChat } from 'ai/react';
import { Loader2, Send, StopCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, KeyboardEvent, FormEvent } from 'react';
import { toast } from 'sonner';
import { sendDeepResearchChat, startDeepResearchChat } from '@/app/_actions/sendDeepResearchChat';
import Heading from '@/app/_components/ui/heading';
import Help from '@/app/_components/ui/help';
import { PromptTemplate } from '@/app/_types/prompt-template';
import { Button } from '../../../../_components/ui/button';
import { ScrollArea } from '../../../../_components/ui/scroll-area';
import { Textarea } from '../../../../_components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../_components/ui/tooltip';
import AssistantSkeleton from './assistant-skeleton';
import BanDialog from './ban-dialog';
import ChatMessage from './chat-message';
import PersonalDataDialog from './personal-data-dialog'; // ポップアップコンポーネントのインポート

type Props = {
  id: string;
  initialMessages?: Message[];
  userId: string;
  userName: string;
  threadId: string;
  templates: PromptTemplate[];
  banWords: { banWord: string }[];
};

type PiiItem = {
  category: string;
  text: string;
};

export default function ChatThread({
  id,
  initialMessages,
  userId,
  userName,
  threadId,
  banWords,
}: Props) {
  const { messages, input, handleInputChange, isLoading, stop, setInput } = useChat({
    id,
    initialMessages,
    body: {
      id,
    },
  });

  const user = {
    id: userId,
    name: userName,
  };

  const [chatMessages, setChatMessages] = useState<Message[]>(messages);
  const [allMessages, setAllMessages] = useState<Message[]>(messages);
  const scrollBottomRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [banDialogOpen, setBanDialogOpen] = useState<boolean>(false); // ダイアログの状態を追加
  const [foundBanWords, setFoundBanWords] = useState<string[]>([]); // 見つかった禁止ワードの状態を追加
  const [piiDialogOpen, setPiiDialogOpen] = useState<boolean>(false); // PIIダイアログの状態を追加
  const [piiList, setPiiList] = useState<PiiItem[]>([]); // PIIリストの状態を追加
  const [piiBoolChecked, setPiiBoolChecked] = useState<boolean>(false); // PIIチェックが完了したかどうかの状態を追加

  const router = useRouter();

  useEffect(() => {
    setChatMessages(messages);
  }, [messages]);

  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [chatMessages]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const checkBanWordsAndPii = async () => {
    // 禁止ワードが含まれているかチェック
    try {
      const foundBanWords = banWords
        .filter((banWord) => input.includes(banWord.banWord))
        .map((banWord) => banWord.banWord);
      if (foundBanWords.length > 0) {
        setFoundBanWords(foundBanWords);
        setBanDialogOpen(true);
        return;
      }
    } catch (error) {
      console.error('Error checking ban words:', error);
      throw error; // エラーを再スローして外側のcatchで処理
    }

    // PIIチェック
    if (!piiBoolChecked) {
      try {
        const response = await fetch('/api/pii/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ input }),
        });
        if (response.ok) {
          const result = await response.json();
          if (result.piiBool) {
            setPiiList(result.piiList);
            setPiiDialogOpen(true);
            setIsSubmitting(true);
            setPiiBoolChecked(true); // PIIチェックが完了したことを示すフラグを設定
            return false;
          }
        } else {
          console.error('PII check failed with status:', response.status);
        }
      } catch (error) {
        console.error('Error during PII check:', error);
        setIsSubmitting(false);
        return false;
      }
    }

    return true;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    const canProceed = await checkBanWordsAndPii();
    if (!canProceed) {
      setIsSubmitting(false); // スケルトンの表示状態をリセット
      return;
    }

    setPiiBoolChecked(false); // PIIチェックが完了したことをリセット

    setIsSubmitting(true);

    const newMessage: Message = {
      id: `${Date.now()}`,
      role: 'user',
      content: input,
    };

    setChatMessages((prev) => [...prev, newMessage]);
    setAllMessages((prev) => [...prev, newMessage]);
    setInput('');

    const responseId = await startDeepResearchChat({
      mode: 'deep-research',
      id: threadId,
      messages: [...allMessages, newMessage],
    });

    if (!responseId.success) {
      setIsSubmitting(false);
      return;
    }

    const instanceId = responseId.data.id;

    let result;
    for (let i = 0; i < 20; i++) {
      const resultRes = await sendDeepResearchChat(instanceId, {
        mode: 'deep-research',
        id: threadId,
        messages: [...allMessages, newMessage],
      });

      if (!resultRes.success) {
        setIsSubmitting(false);
        toast.error(resultRes.message);
        return;
      }

      if (resultRes.data.searchResults.length || resultRes.data.content !== '処理中です') {
        result = resultRes.data;
        break;
      }
      await new Promise((r) => setTimeout(r, 120000)); //2分待機
    }

    if (!result) {
      toast.error('Deep Researchの結果が取得できませんでした。');
    } else {
      const assistantMessage = result;
      setChatMessages((prev) => [
        ...prev,
        {
          id: `${Date.now() + 1}`,
          role: 'assistant',
          content: assistantMessage.content,
          searchResults: assistantMessage.searchResults || [],
        },
      ]);
      setAllMessages((prev) => [
        ...prev,
        {
          id: `${Date.now() + 1}`,
          role: 'assistant',
          content: assistantMessage.content,
          searchResults: assistantMessage.searchResults || [],
        },
      ]);
      router.refresh();
    }

    setIsSubmitting(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey && event.key === 'Enter') || (event.metaKey && event.key === 'Enter')) {
      event.preventDefault();
      handleSend(new Event('submit') as unknown as FormEvent);
    }
  };

  // テキストバリデーション
  // TODO: 追々フォームの値、送信中フラグ、エラー、バリデーションをライブラリに置き換えたい
  const isTextValid = () => {
    return /[^\s]/.test(input);
  };

  return (
    <div className="flex grow flex-col px-4 pb-4 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <Heading level={3} className="flex items-center gap-x-[2px]">
          Deep Research
          <Help message="Deep Researchができる画面です。" />
        </Heading>
      </div>
      <ScrollArea className="grow">
        <div className="flex flex-col gap-y-6 px-4">
          {chatMessages.map((message) => (
            <div key={message.id}>
              <ChatMessage user={user} message={message} threadId={threadId} />
            </div>
          ))}
          {isSubmitting && <AssistantSkeleton />}

          {/* 最新メッセージにスクロールするためのRef要素 */}
          <div ref={scrollBottomRef} />
        </div>
        {isLoading && <Loader2 className="text-muted-foreground my-4 ml-20 size-5 animate-spin" />}
      </ScrollArea>
      <div className="flex items-center justify-center gap-x-2 pl-2 pt-6">
        <form className="flex w-full max-w-3xl items-center gap-x-2" onSubmit={handleSend}>
          <div className="relative flex w-full items-center">
            <div className="flex w-full flex-col">
              <Textarea
                ref={textareaRef}
                value={input}
                placeholder={`メッセージを入力してください\n例：〇〇について調べてください`}
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground flex h-10 max-h-80 w-full grow resize-none overflow-y-auto rounded-md border px-3 py-2 pr-20 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                onChange={(e) => {
                  handleInputChange(e);
                  if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                    textareaRef.current.style.height = `${Math.min(
                      textareaRef.current.scrollHeight,
                      320
                    )}px`;
                  }
                }}
                onKeyDown={handleKeyDown}
              />
              <p className="mt-2 flex justify-center text-xs">
                回答を間違えることがあります。ご理解のうえご利用ください。
              </p>
            </div>
            <div className="absolute bottom-7 right-3">
              {isLoading ? (
                <Button type="button" onClick={stop} className="size-6 p-0">
                  <StopCircle size={20} />
                </Button>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="submit"
                        disabled={isLoading || !isTextValid()}
                        className="size-6 disabled:opacity-50"
                      >
                        <Send size={20} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="dark:bg-dark-gray bg-gray-100 text-black dark:text-white">
                      <p>送信</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </form>
      </div>
      <BanDialog
        isOpen={banDialogOpen}
        onClose={() => setBanDialogOpen(false)}
        banWords={foundBanWords}
      />
      <PersonalDataDialog
        isOpen={piiDialogOpen}
        onClose={() => {
          setPiiDialogOpen(false);
          setIsSubmitting(false); // スケルトンの表示状態をリセット
        }}
        piiList={piiList}
        onConfirm={async () => {
          setPiiDialogOpen(false);
          setPiiBoolChecked(true); // PIIチェックが完了したことを示すフラグを設定
          setIsSubmitting(true); // 送信中の状態を設定
          await handleSend(new Event('submit') as unknown as React.FormEvent); // 型キャストを使用してエラーを回避
        }}
      />
    </div>
  );
}
