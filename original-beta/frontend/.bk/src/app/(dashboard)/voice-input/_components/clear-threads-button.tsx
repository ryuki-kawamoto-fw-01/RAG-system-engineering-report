'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import SvgDelete from '@/app/_components/icon/button/Delete';
import { Button } from '@/app/_components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/_components/ui/dialog';
import { clearChatThreads } from '../_actions/clearChatThreads';

type Props = {
  className?: string;
};

export default function ClearThreadsButton({ className }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  async function handleClick() {
    setIsLoading(true);

    const res = await clearChatThreads();
    if (res.success) {
      toast.success('全てのチャットを削除しました');
      setIsOpen(false); // ダイアログを閉じる
    } else {
      toast.error('全てのチャットの削除に失敗しました');
    }

    setIsLoading(false);
    router.push('/voice-input');
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
            <DialogTitle>全てのチャットを削除しますか？</DialogTitle>
          </DialogHeader>
          <div>
            <p>
              全てのチャットを削除すると、全てのメッセージやファイルが完全に消去されます。復元することはできません。
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
