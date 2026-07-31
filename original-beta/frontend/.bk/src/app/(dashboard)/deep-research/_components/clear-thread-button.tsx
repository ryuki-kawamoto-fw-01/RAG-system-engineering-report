'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../../_components/ui/button';
import clearDeepThread from '../_actions/clearDeepThread';

type Props = {
  id: string;
};

export default function ClearDeepThread({ id }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    setSubmitting(true);

    const res = await clearDeepThread(id);
    if (res.success) {
      toast.success('リサーチを削除しました');
    } else {
      toast.error(res.message ?? 'リサーチの削除に失敗しました');
    }

    setSubmitting(false);
    router.push('/deep-research');
  }

  return (
    <Button size="icon" className="size-8 rounded-sm" onClick={handleClick} disabled={submitting}>
      <Trash2 className="size-5" />
    </Button>
  );
}
