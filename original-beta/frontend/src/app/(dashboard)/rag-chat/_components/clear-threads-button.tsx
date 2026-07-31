'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import SvgDelete from '@/app/_components/icon/button/Delete';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/_components/ui/dialog';
import { getMessage } from '@/app/_utils/message';
import { Button } from '../../../_components/ui/button';
import { clearChatThreads } from '../_actions/clearChatThreads';

export default function ClearThreadsButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function handleClick() {
    setSubmitting(true);

    const res = await clearChatThreads();
    if (res.success) {
      toast.success(getMessage('I_F_00020', '問い合わせ'));
      setDialogOpen(false); // ダイアログを閉じる
    } else {
      toast.error(getMessage('E_F_00040', '問い合わせ'));
    }

    setSubmitting(false);
    router.push('/rag-chat');
  }

  return (
    <>
      <Button variant="text" size="text" onClick={() => setDialogOpen(true)} disabled={submitting}>
        <SvgDelete className="size-4" />
        <span>全てを削除</span>
      </Button>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>全ての問い合わせを削除しますか？</DialogTitle>
          </DialogHeader>
          <div>
            <p>一度削除すると元に戻すことはできません。</p>
            <p className="mt-6">本当に削除してもよろしいでしょうか？</p>
          </div>
          <DialogFooter>
            <Button
              variant="tertiary"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
              className="w-[120px]"
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              disabled={submitting}
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
