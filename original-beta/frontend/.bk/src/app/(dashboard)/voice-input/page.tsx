'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';
import SvgAudio from '@/app/_components/icon/button/Audio';
import { Button } from '@/app/_components/ui/button';
import Heading from '@/app/_components/ui/heading';
import Help from '@/app/_components/ui/help';
import { useConfigStore } from '@/app/_lib/stores';
import PageLayout from '../../_components/layout/page-layout';
import { createChatThread } from './_actions/createChatThread';

export default function Page() {
  const router = useRouter();

  const { setSession } = useConfigStore(
    useShallow((state) => ({
      setSession: state.setSession,
    }))
  );

  // 新しいチャットを開始する関数
  const createThread = async () => {
    const res = await createChatThread();
    if (res.success) {
      await setSession(res.id!);
      router.push(`/voice-input/${res.id}`);
    } else {
      toast.error('チャットの作成に失敗しました');
    }
  };

  return (
    <PageLayout>
      <div className="flex h-full flex-col justify-between">
        <Heading level={3} className="flex items-center gap-x-[2px]">
          音声入力
          <Help
            message={`生成AIと音声でチャットができる画面です。\nマイクとスピーカーをご用意していただくと音声のみで会話が可能です。`}
          />
        </Heading>
        <div className="flex justify-center">
          <Button variant="secondary" onClick={createThread}>
            <SvgAudio className="size-4" />
            会話を開始する
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
