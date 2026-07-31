'use client';
import { MessageCircle, MessageCircleOff } from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';
import { ChatThreadModel } from '../../../../../config';
import { Button } from '../../../_components/ui/button';
import { ScrollArea } from '../../../_components/ui/scroll-area';
import ClearThreadButton from './clear-thread-button';
import ClearThreadsButton from './clear-threads-button';
import NewChatButton from './new-chat-button';

type Props = {
  threads: ChatThreadModel[];
};

export default function Threads({ threads }: Props) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredThreads = threads.filter((thread) =>
    thread.title!.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className="dark:bg-primary-dark flex h-full flex-col bg-gray-100 p-4">
      <div className="text-xs font-bold uppercase text-black dark:text-white">リサーチ履歴</div>
      <div className="my-2 border-b border-gray-300 dark:border-gray-600" />
      <input
        type="text"
        placeholder="検索..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="my-2 rounded border border-gray-300 p-2"
      />
      <ScrollArea className="my-4 grow">
        {filteredThreads.length > 0 ? (
          <div className="flex flex-col space-y-2">
            {filteredThreads.map((thread) => (
              <div key={thread.id} className="flex items-center">
                <Button variant="link" asChild className="gap-x-2 px-0">
                  <Link href={`/deep-research/${thread.id}`}>
                    <div className="flex w-72 items-center gap-x-2 text-black dark:text-white">
                      <MessageCircle className="shrink-0" />
                      <span className="truncate">{thread.title}</span>
                    </div>
                  </Link>
                </Button>
                <ClearThreadButton id={thread.id} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-full w-72 items-center justify-center">
            <MessageCircleOff className="text-muted-foreground mr-2 text-base text-black dark:text-white" />
            <span className="text-muted-foreground text-base text-black dark:text-white">
              リサーチがありません。
            </span>
          </div>
        )}
      </ScrollArea>
      {threads.length > 0 && <ClearThreadsButton />}
      <NewChatButton />
    </aside>
  );
}
