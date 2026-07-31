'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';
import VoiceThreadList from '@/app/_components/chat/voice-thread-list';
import {
  HistoryContent,
  HistoryHeader,
  HistoryLayout,
  HistoryTitle,
} from '@/app/_components/history/history-layout';
import SvgAdd from '@/app/_components/icon/button/Add';
import SearchBox from '@/app/_components/search-box';
import { Button } from '@/app/_components/ui/button';
import { useConfigStore } from '@/app/_lib/stores';
import clearChatThread from '../_actions/clearChatThread';
import { createChatThread } from '../_actions/createChatThread';
import { Thread } from '../_utils/schema';
import ClearThreadsButton from './clear-threads-button';

type Props = {
  threads: Thread[];
};

export default function ChatHistory({ threads }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { setSession } = useConfigStore(
    useShallow((state) => ({
      setSession: state.setSession,
    }))
  );

  // タイトル検索
  const filteredThreads = threads
    .filter((thread) => thread.title!.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // 新しいチャットの作成
  const createThread = async () => {
    const res = await createChatThread();
    if (res.success) {
      await setSession(res.id!);
      router.push(`/voice-input/${res.id}`);
    } else {
      toast.error('チャットの作成に失敗しました');
    }
  };

  // チャットの削除
  const deleteThread = async (id: string) => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    const res = await clearChatThread(id);
    if (res.success) {
      toast.success('チャットを削除しました');
    } else {
      toast.error(res.message ?? 'チャットの削除に失敗しました');
    }

    setIsLoading(false);
    router.push('/voice-input');
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
        <VoiceThreadList threads={filteredThreads} deleteThread={deleteThread} className="mt-2" />
      </HistoryContent>
      {threads.length > 0 && (
        <div>
          <ClearThreadsButton />
        </div>
      )}
    </HistoryLayout>
  );
}
