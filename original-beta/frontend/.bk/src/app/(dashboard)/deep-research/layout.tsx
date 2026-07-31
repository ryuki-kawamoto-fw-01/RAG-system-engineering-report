import React, { Children, isValidElement, cloneElement, ReactElement } from 'react';
import { getChatThreads } from './_actions/getChatThreads';
import Threads from './_components/threads';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { threads } = await getChatThreads();

  // titleがundefinedの場合にデフォルト値を設定
  const normalizedThreads = threads.map((thread) => ({
    ...thread,
    title: thread.title || '(新しいリサーチ)',
  }));

  return (
    <div className="flex h-full">
      <Threads threads={normalizedThreads} />
      {Children.map(children, (child) =>
        isValidElement(child)
          ? cloneElement(child as ReactElement<{ threadId: string }>, { threadId: threads[0]?.id })
          : child
      )}
    </div>
  );
}
