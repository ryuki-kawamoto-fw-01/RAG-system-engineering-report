'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { clearChatThreads } from '@/app/_actions/chat/clearChatThreads';
import SvgDelete from '@/app/_components/icon/button/Delete';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/_components/ui/dialog';

import { ChatType } from '@/app/_types/chat-type';
import { Button } from '../../../../_components/ui/button';

type Props = {
  task: string;
  className?: string;
};

export default function ClearThreadsButton({ task, className }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  async function handleClick() {
    setIsLoading(true);

    const res = await clearChatThreads(ChatType.Agent);
    if (res.success) {
      toast.success('全てのタスクを削除しました');
      setIsOpen(false); // ダイアログを閉じる
    } else {
      toast.error('全てのタスクの削除に失敗しました');
    }

    setIsLoading(false);
    router.push(`/agent/${task}`);
  }

  return (
    <>
      <Button
        variant="text"
        size="text"
        onClick={() => setIsOpen(true)}
        disabled={isLoading}
        className={className}
      >
        <SvgDelete className="size-4" />
        <span>全てを削除</span>
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>全てのタスクを削除しますか？</DialogTitle>
          </DialogHeader>
          <div>
            <p>
              全てのタスクを削除すると、全てのメッセージやファイルが完全に消去されます。復元することはできません。
            </p>
            <p className="mt-6">本当に削除しますか？</p>
          </div>
          <DialogFooter>
            <Button
              variant="tertiary"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
              className="w-[120px]"
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              disabled={isLoading}
              onClick={handleClick}
              className="w-[120px]"
            >
              全て削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
