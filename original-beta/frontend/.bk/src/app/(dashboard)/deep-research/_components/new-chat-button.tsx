'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '../../../_components/ui/button';
import { createDeepThread } from '../_actions/createDeepThread';

export default function NewChatButton() {
  const router = useRouter();

  async function handleClick() {
    const res = await createDeepThread();
    if (res.success) {
      router.push(`/deep-research/${res.id}`);
    } else {
      toast.error('リサーチの作成に失敗しました');
    }
  }

  return (
    <Button
      variant="outline"
      className="bg-dark-gray mt-6 gap-x-1 text-white shadow-md hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
      onClick={handleClick}
    >
      <Plus size={18} className="text-white dark:text-black" />
      新しいリサーチを開始
    </Button>
  );
}
