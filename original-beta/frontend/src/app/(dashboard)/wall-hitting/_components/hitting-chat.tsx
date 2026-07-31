'use client';

import { useState, useRef, useEffect } from 'react';
import ChatBox from '@/app/_components/chat/chat-box';
import ChatMessageList from '@/app/_components/chat/chat-message-list';
import { cn } from '@/app/_utils/tw-merge';
import { wallHittingChat } from '../_actions/wallHittingChat';
import { WallHittingMessage } from '../_utils/type';

type Props = {
  theme: string;
  idea: string;
  className?: string;
};

export default function HittingChat({ theme, idea, className }: Props) {
  // 初期履歴は空
  const [messages, setMessages] = useState<WallHittingMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 初回AI返答のみ履歴に追加
  useEffect(() => {
    (async () => {
      setIsSubmitting(true);
      setError(null);
      try {
        // テーマ・アイデアをAIに渡して返答のみ履歴に追加
        const aiMsg = await wallHittingChat([
          { id: 'init', role: 'user', content: `テーマ: ${theme}\nアイデア: ${idea}` },
        ]);
        setMessages([aiMsg]);
      } catch {
        setError('AIからの返答取得に失敗しました。');
      }
      setIsSubmitting(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, idea]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    const userMsg: WallHittingMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
    };
    // 履歴にユーザー入力を追加
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      // 履歴＋ユーザー入力をAIに渡して返答を追加
      const aiMsg = await wallHittingChat([...messages, userMsg]);
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setError('AIからの返答取得に失敗しました。');
    }
    setIsSubmitting(false);
  };

  return (
    <div className={cn('flex flex-col w-full h-full overflow-y-auto p-4 pt-6', className)}>
      <ChatMessageList
        messages={messages}
        isLoading={isSubmitting}
        className="mx-auto w-full grow"
      />
      <div ref={messagesEndRef} />
      {error && <div className="text-center text-red-500">{error}</div>}
      <div className="flex justify-center pt-9">
        <form className="w-full max-w-[720px]" onSubmit={handleSend}>
          <div className="relative">
            <div className="flex flex-col">
              <ChatBox
                value={input}
                isLoading={isSubmitting}
                placeholder="メッセージを入力..."
                onChange={(e) => setInput(e.target.value)}
                isDisabled={isSubmitting || !input.trim()}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
