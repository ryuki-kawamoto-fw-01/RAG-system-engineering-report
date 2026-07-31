import { useCallback, useState, KeyboardEvent, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import AssistantAvatar from '@/app/_components/chat/assistant-avatar';
import AssistantMessageSkeleton from '@/app/_components/chat/assistant-message-skeleton';
import SvgSend from '@/app/_components/icon/button/Send';
import SvgSendPause from '@/app/_components/icon/button/SendPause';
import { Button } from '@/app/_components/ui/button';
import { ScrollArea } from '@/app/_components/ui/scroll-area';
import { Textarea } from '@/app/_components/ui/textarea';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import {
  setResult,
  ChatHistory,
  setChat as setChatSlice,
  setChatHistory as setChatHistorySlice,
} from '@/app/_store/slice/new-product-idea';
import { newProIdea } from '../_actions/newProIdea';
import { updateProIdea } from '../_actions/updateProIdea';

export function NewProductIdeaChat() {
  const dispatch = useAppDispatch();
  const selector = useAppSelector((state) => state.newProductIdea);
  const {
    text,
    ideaDirection,
    additionalConsiderations,
    chatHistory,
    content,
    filePlainList,
    chat,
  } = selector;

  const [isLoading, setIsLoading] = useState(false);

  const setChat = useCallback((chat: string) => dispatch(setChatSlice(chat)), [dispatch]);
  const setChatHistory = useCallback(
    (chatHistory: ChatHistory[]) => dispatch(setChatHistorySlice(chatHistory)),
    [dispatch]
  );

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [chatHistory]);

  const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!chat.trim()) return; // 空送信防止

    setIsLoading(true);
    setChat('');

    // ユーザーの発言を履歴に追加
    setChatHistory([...chatHistory, { role: 'user', chat }]);

    const formData = new FormData();

    if (filePlainList && filePlainList.length > 0) {
      if (filePlainList instanceof FileList) {
        for (const file of filePlainList) {
          formData.append('fileList', file);
        }
      } else {
        formData.append('fileList', JSON.stringify(filePlainList));
      }
    }
    if (text && text.trim() !== '') {
      formData.append('text', text);
    }
    if (ideaDirection && ideaDirection.trim() !== '') {
      formData.append('ideaDirection', ideaDirection);
    }
    if (additionalConsiderations && additionalConsiderations.trim() !== '') {
      formData.append('additionalConsiderations', additionalConsiderations);
    }
    formData.append('chatHistory', JSON.stringify([...chatHistory]));
    formData.append('chat', chat);

    try {
      // content(=作成済みアイデア)が存在する場合は更新、存在しない場合は新規作成
      const response =
        content && content.trim() !== ''
          ? await updateProIdea(chat, chatHistory, content)
          : await newProIdea(formData);
      if (response.success) {
        const responseChat = response.chat;
        setChatHistory([
          ...chatHistory,
          { role: 'user', chat },
          { role: 'assistant', chat: responseChat },
        ]);
        if (response.content !== null) {
          const result = response.content;
          // result(アイデア)が作成されていれば更新をする
          if (result && result.trim() !== '') {
            dispatch(setResult(result));
          }
        }
      } else {
        toast.error(response.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // テキストバリデーション
  // TODO: 追々フォームの値、送信中フラグ、エラー、バリデーションをライブラリに置き換えたい
  const isTextValid = () => {
    return /[^\s]/.test(chat);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (isLoading || !isTextValid()) {
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

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="grow">
        <div className="flex flex-col gap-y-3.5">
          {chatHistory.map((chatHistory: ChatHistory, index: number) => (
            <div
              key={index}
              className={`flex gap-x-2 ${chatHistory.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {chatHistory.role === 'assistant' && <AssistantAvatar />}
              <div
                className={`inline-block max-w-screen-sm rounded-xl px-5 py-3 text-lg font-normal ${
                  chatHistory.role === 'user'
                    ? ' ml-10 min-w-14 bg-sky-100'
                    : ' mr-10 min-w-44 bg-white '
                }`}
              >
                <span dangerouslySetInnerHTML={{ __html: chatHistory.chat }} />
              </div>
            </div>
          ))}
          {isLoading && <AssistantMessageSkeleton />}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      <form onSubmit={handleChatSubmit}>
        <div className="relative">
          <Textarea
            value={chat}
            onChange={(e) => setChat(e.target.value)}
            onKeyDown={handleKeyDown}
            className="mt-3 h-[77px] resize-none text-lg"
            placeholder="メッセージを入力してください。"
          />
          <div className="absolute bottom-2 right-4">
            {isLoading ? (
              <Button type="button" variant="ghost" size="icon">
                <SvgSendPause />
              </Button>
            ) : (
              <Button type="submit" size="icon" disabled={isLoading || !chat.trim()}>
                <SvgSend />
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
