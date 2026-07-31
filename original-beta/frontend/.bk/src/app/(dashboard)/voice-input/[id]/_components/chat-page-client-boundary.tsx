'use client';

import { useShallow } from 'zustand/react/shallow';
import Heading from '@/app/_components/ui/heading';
import Help from '@/app/_components/ui/help';
import { useConfigStore } from '@/app/_lib/stores';
import { Message } from '../../_utils/schema';
import ChatInterface from './chat-interface';
import SessionTimer from './session-timer';

interface ChatPageClientBoundaryProps {
  userId: string;
  threadId: string;
  initialMessages: Message[];
}

export default function ChatPageClientBoundary({
  userId,
  threadId,
  initialMessages,
}: ChatPageClientBoundaryProps) {
  const { accessToken } = useConfigStore(
    useShallow((state) => ({
      accessToken: state.clientConfig.accessToken,
    }))
  );

  return (
    <div className="relative flex h-full flex-col">
      <ChatInterface
        userId={userId}
        threadId={threadId}
        initialMessages={initialMessages}
        accessToken={accessToken}
      />
      <div className="absolute inset-x-0 flex items-center justify-between pt-1.5">
        <div>
          <Heading level={3} className="flex items-center gap-x-[2px]">
            音声入力
            <Help
              message={`生成AIと音声でチャットができる画面です。\nマイクとスピーカーをご用意していただくと音声のみで会話が可能です。`}
            />
          </Heading>
        </div>
        <div className="absolute right-36 top-20 z-10">
          <SessionTimer />
        </div>
      </div>
    </div>
  );
}
