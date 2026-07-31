'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import SvgAudio from '@/app/_components/icon/button/Audio';
import SvgMute from '@/app/_components/icon/button/Mute';
import SvgUnmute from '@/app/_components/icon/button/Unmute';
import { Button } from '@/app/_components/ui/button';
import { useConfigStore } from '@/app/_lib/stores';

interface VoiceInputProps {
  threadId: string;
  isRecording: boolean;
  onToggleRecording: () => Promise<void>;
}

export function VoiceInput({ threadId, isRecording, onToggleRecording }: VoiceInputProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { isSessionExpired, resetSession } = useConfigStore(
    useShallow((state) => ({
      isSessionExpired: state.isSessionExpired,
      resetSession: state.setSession,
    }))
  );

  // セッションをリセット
  const handleReset = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await resetSession(threadId);
    } catch (error) {
      console.error('セッションのリセットに失敗しました:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {isSessionExpired ? (
        <Button
          variant="secondary"
          onClick={handleReset}
          className="mb-2 rounded-full"
          aria-label="Stop recording"
        >
          <SvgAudio className="size-4" />
          会話を再開する
        </Button>
      ) : isLoading ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin dark:text-white" />
          セッション取得中...
        </>
      ) : (
        <>
          <Button
            variant="tertiary"
            onClick={onToggleRecording}
            className="mb-2 rounded-full"
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isRecording ? (
              <div className="flex items-center gap-1.5">
                <SvgMute className="size-4" />
                ミュート
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <SvgUnmute className="size-4" />
                ミュート解除
              </div>
            )}
          </Button>
        </>
      )}
    </div>
  );
}
