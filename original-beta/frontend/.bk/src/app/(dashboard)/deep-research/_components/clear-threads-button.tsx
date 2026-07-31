'use client';

import { Broom } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../_components/ui/alert-dialog';
import { Button } from '../../../_components/ui/button';
import { clearDeepThreads } from '../_actions/clearDeepThreads';

export default function ClearThreadsButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function handleClick() {
    setSubmitting(true);

    const res = await clearDeepThreads();
    if (res.success) {
      toast.success('全てのリサーチを削除しました');
      setDialogOpen(false); // ダイアログを閉じる
    } else {
      toast.error('全てのリサーチの削除に失敗しました');
    }

    setSubmitting(false);
    router.push('/deep-research');
  }

  return (
    <>
      <Button
        variant="outline"
        className="mt-6 gap-x-1 border-black text-black shadow-md hover:bg-gray-200 dark:border-white dark:bg-transparent dark:text-white dark:hover:bg-gray-800"
        onClick={() => setDialogOpen(true)}
        disabled={submitting}
      >
        <Broom />
        <span>全てのリサーチを削除</span>
      </Button>
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent className="dark:bg-dark-gray bg-gray-100 text-black dark:text-white sm:max-w-[550px]">
          <AlertDialogHeader>
            <AlertDialogTitle>確認</AlertDialogTitle>
            <AlertDialogDescription>
              全てのリサーチを削除しますか？
              <br />
              この操作は元に戻せませんのでご注意ください。
              <br />
              処理には10秒程度かかる場合があります。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              onClick={handleClick}
              disabled={submitting}
              className="border border-black font-bold text-red-600 shadow-md hover:bg-gray-200 dark:border-white dark:bg-transparent dark:font-bold dark:hover:bg-gray-800"
            >
              {submitting ? '削除中...' : '削除'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border border-black text-black shadow-md hover:bg-gray-200 dark:border-white dark:bg-transparent dark:text-white dark:hover:bg-gray-800"
              disabled={submitting}
            >
              キャンセル
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
