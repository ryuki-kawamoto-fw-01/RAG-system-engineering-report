'use client';

import { Timer } from 'lucide-react';
import type React from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';
import { useConfigStore } from '@/app/_lib/stores';

const NOTIFICATION_SECONDS = 600; // 10分

/**
 * 秒を時:分:秒の形式にフォーマット
 *
 * @param seconds 秒数
 * @returns HH:MM:SS形式の文字列
 */
const formatTime = (seconds: number): string => {
  if (seconds === 0) return '00:00:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return [hours, minutes, remainingSeconds].map((v) => (v < 10 ? '0' + v : v)).join(':');
};

export default function SessionTimer() {
  const { setSessionExpired, isSessionExpired, expireTimeStamp } = useConfigStore(
    useShallow((state) => ({
      setSessionExpired: state.setSessionExpired,
      isSessionExpired: state.isSessionExpired,
      expireTimeStamp: state.getExpireTimeStamp(),
    }))
  );

  const [currentTime, setCurrentTime] = useState<number>(Date.now()); // 現在時刻を保持するステート
  const toastShownRef = useRef<boolean>(false); // トースト表示用のフラグ
  const expiredToastShownRef = useRef<boolean>(false); // セッション期限切れトースト表示用のフラグ
  const prevRemainingTimeRef = useRef<number | null>(null); // 前回の残り時間を保持

  // 残り時間を計算（秒単位）
  const remainingTime = useMemo(() => {
    if (!expireTimeStamp) return 0;
    const diffInSeconds = Math.floor((expireTimeStamp - currentTime) / 1000);
    const timeLeft = Math.max(diffInSeconds, 0);

    // 残り時間が0になったらセッション期限切れを設定
    if (timeLeft === 0) {
      setSessionExpired(true);
    } else if (timeLeft > 0) {
      setSessionExpired(false);
    }

    return timeLeft;
  }, [currentTime, expireTimeStamp, setSessionExpired]);

  // 残り時間が変わるたびにステータスを更新
  useEffect(() => {
    if (remainingTime === NOTIFICATION_SECONDS && !toastShownRef.current && expireTimeStamp) {
      toast.message('残り時間10分です。');
      toastShownRef.current = true;
    }

    if (remainingTime > NOTIFICATION_SECONDS) {
      toastShownRef.current = false;
    }

    // セッションが切れた時にトーストを表示
    if (
      prevRemainingTimeRef.current !== null &&
      prevRemainingTimeRef.current > 0 &&
      remainingTime === 0 &&
      !expiredToastShownRef.current
    ) {
      toast.message(
        `セッションが切れました。会話を継続する場合は「会話を再開する」を押してください。`
      );
      expiredToastShownRef.current = true;
    }

    // 前回の残り時間を更新
    prevRemainingTimeRef.current = remainingTime;
  }, [remainingTime, expireTimeStamp]);

  // タイマーの設定
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    // 有効期限があり、まだ期限切れでない場合のみタイマーを動かす
    if (expireTimeStamp && remainingTime > 0) {
      interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
    }

    // クリーンアップ関数
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [expireTimeStamp, remainingTime]);

  return (
    !isSessionExpired && (
      <div className="absolute bottom-12 flex w-[200px] flex-col items-center justify-center">
        <div
          className={`flex items-center gap-1 text-sm ${remainingTime <= NOTIFICATION_SECONDS ? 'text-red-500' : 'text-gray-700'}`}
          aria-live="polite"
        >
          <Timer className="size-4" />
          {formatTime(remainingTime)}
        </div>
      </div>
    )
  );
}
