'use client';

import { Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import clearChatThread from '@/app/_actions/chat/clearChatThread';
import { Button } from '@/app/_components/ui/button';
import { ChatType } from '@/app/_types/chat-type';

type Props = {
  id: string;
};

export default function ClearChatThread({ id }: Props) {
  const params = useParams();
  const router = useRouter();
  const task = params.task as string;
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    setSubmitting(true);

    const res = await clearChatThread(id, ChatType.Agent, `/agent/${task}`);
    if (res.success) {
      toast.success('タスクを削除しました');
    } else {
      toast.error(res.message ?? 'タスクの削除に失敗しました');
    }
    setSubmitting(false);
    router.push(`/agent/${task}`);
  }

  return (
    <Button size="icon" className="size-8 rounded-sm" onClick={handleClick} disabled={submitting}>
      <Trash2 className="size-5" />
    </Button>
  );
}
