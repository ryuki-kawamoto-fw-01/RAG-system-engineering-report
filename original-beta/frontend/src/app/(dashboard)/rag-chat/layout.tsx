import React, { Children, isValidElement, cloneElement, ReactElement } from 'react';
import { getChatThreads } from './_actions/getChatThreads';
import ChatHistory from './_components/chat-history';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { threads } = await getChatThreads();

  // titleがundefinedの場合にデフォルト値を設定
  const normalizedThreads = threads.map((thread) => ({
    ...thread,
    title: thread.title || '(新しいチャット)',
  }));

  return (
    <div className="flex h-full">
      <ChatHistory threads={normalizedThreads} />
      {Children.map(children, (child) =>
        isValidElement(child)
          ? cloneElement(child as ReactElement<{ threadId: string }>, { threadId: threads[0]?.id })
          : child
      )}
    </div>
  );
}
