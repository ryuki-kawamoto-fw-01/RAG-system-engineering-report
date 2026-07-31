'use client';

import { Plus } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { createChatThread } from '@/app/_actions/chat/createChatThread';
import { Button } from '@/app/_components/ui/button';
import { ChatType } from '@/app/_types/chat-type';

export default function NewChatButton() {
  const router = useRouter();
  const params = useParams();
  const task = params.task as string;

  async function handleClick() {
    const res = await createChatThread(ChatType.Agent);
    if (res.success) {
      if (task) {
        router.push(`/agent/${task}/${res.id}`);
      }
    } else {
      toast.error('タスクの作成に失敗しました');
    }
  }

  return (
    <Button
      variant="outline"
      className="bg-dark-gray mt-6 gap-x-1 text-white shadow-md hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
      onClick={handleClick}
    >
      <Plus size={18} className="text-white dark:text-black" />
      新しいタスクを開始
    </Button>
  );
}
