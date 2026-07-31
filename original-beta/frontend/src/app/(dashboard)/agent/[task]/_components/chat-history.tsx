'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from 'sonner';
import clearChatThread from '@/app/_actions/chat/clearChatThread';
import { createChatThread } from '@/app/_actions/chat/createChatThread';
import {
  HistoryContent,
  HistoryHeader,
  HistoryLayout,
  HistoryTitle,
} from '@/app/_components/history/history-layout';
import SvgAdd from '@/app/_components/icon/button/Add';
import SearchBox from '@/app/_components/search-box';
import { ChatType } from '@/app/_types/chat-type';
import { ChatThreadModel } from '../../../../../../config';
import ThreadList from '../../../../_components/chat/thread-list';
import { Button } from '../../../../_components/ui/button';
import ClearThreadsButton from './clear-threads-button';

type Props = {
  threads: ChatThreadModel[];
};

export default function ChatHistory({ threads }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const router = useRouter();
  const params = useParams();
  const task = params.task as string;

  const filteredThreads = threads.filter((thread) =>
    thread.title!.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const createThread = async () => {
    const res = await createChatThread(ChatType.Agent);
    if (res.success) {
      router.push(`/agent/${task}/${res.id}`);
    } else {
      toast.error('タスクの作成に失敗しました');
    }
  };

  const deleteThread = async (id: string) => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    const res = await clearChatThread(id, ChatType.Agent, `/agent/${task}`);
    if (res.success) {
      toast.success('タスクを削除しました');
    } else {
      toast.error(res.message ?? 'タスクの削除に失敗しました');
    }

    setIsLoading(false);
    router.push(`/agent/${task}`);
  };

  return (
    <HistoryLayout>
      <HistoryHeader>
        <HistoryTitle>履歴</HistoryTitle>
        <Button variant="icon" size="icon" onClick={createThread}>
          <SvgAdd className="size-5" />
        </Button>
      </HistoryHeader>
      <HistoryContent>
        <SearchBox
          placeholder="タスクを検索"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <ThreadList
          threads={filteredThreads}
          deleteThread={deleteThread}
          basePath={`/agent/${task}`}
          className="mt-2"
        />
      </HistoryContent>
      {threads.length > 0 && (
        <div>
          <ClearThreadsButton task={task} />
        </div>
      )}
    </HistoryLayout>
  );
}
