'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  HistoryContent,
  HistoryHeader,
  HistoryLayout,
  HistoryTitle,
} from '@/app/_components/history/history-layout';
import SvgAdd from '@/app/_components/icon/button/Add';
import SearchBox from '@/app/_components/search-box';
import { getMessage } from '@/app/_utils/message';
import { ChatThreadModel } from '../../../../../config';
import ThreadList from '../../../_components/chat/thread-list';
import { Button } from '../../../_components/ui/button';
import clearChatThread from '../_actions/clearChatThread';
import { createChatThread } from '../_actions/createChatThread';
import ClearThreadsButton from './clear-threads-button';

type Props = {
  threads: ChatThreadModel[];
};

export default function ChatHistory({ threads }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const router = useRouter();

  const filteredThreads = threads.filter((thread) =>
    thread.title!.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const createThread = async () => {
    const res = await createChatThread();
    if (res.success) {
      router.push(`/chat/${res.id}`);
    } else {
      toast.error('チャットの作成に失敗しました');
    }
  };

  const deleteThread = async (id: string) => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    const res = await clearChatThread(id);
    if (res.success) {
      toast.success(getMessage('I_F_00010', 'チャット'));
    } else {
      toast.error(res.message ?? getMessage('E_F_00030', 'チャット'));
    }

    setIsLoading(false);
    router.push('/chat');
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
          placeholder="チャットを検索"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <ThreadList threads={filteredThreads} deleteThread={deleteThread} className="mt-2" />
      </HistoryContent>
      {threads.length > 0 && (
        <div>
          <ClearThreadsButton />
        </div>
      )}
    </HistoryLayout>
  );
}
