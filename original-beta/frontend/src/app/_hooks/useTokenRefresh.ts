'use client';

import { useEffect, useRef } from 'react';
import { refreshAuthSession } from '../_lib/auth/refresh-session';

export function useTokenRefresh(
  tokenLifetimeMinutes: number = 60,
  refreshThresholdMinutes: number = 15,
  checkIntervalSeconds: number = 60
) {
  const isRefreshingRef = useRef(false);
  const lastRefreshTimeRef = useRef<number>(Date.now());
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const checkAndRefreshToken = async () => {
      if (isRefreshingRef.current) return;

      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
      const timeUntilExpiry = tokenLifetimeMinutes * 60 * 1000 - timeSinceLastRefresh;
      const refreshThresholdMs = refreshThresholdMinutes * 60 * 1000;

      if (timeUntilExpiry <= refreshThresholdMs) {
        isRefreshingRef.current = true;
        abortControllerRef.current = new AbortController();

        try {
          const result = await refreshAuthSession(abortControllerRef.current.signal);
          if (result.success) {
            lastRefreshTimeRef.current = now;
            console.log('[TOKEN_REFRESH] トークンをリフレッシュしました');
          } else {
            console.error('[TOKEN_REFRESH] リフレッシュ失敗:', result.error);
          }
        } catch (error) {
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error('[TOKEN_REFRESH] リフレッシュエラー:', error);
          }
        } finally {
          isRefreshingRef.current = false;
          abortControllerRef.current = null;
        }
      }
    };

    checkAndRefreshToken();
    const interval = setInterval(checkAndRefreshToken, checkIntervalSeconds * 1000);

    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [tokenLifetimeMinutes, refreshThresholdMinutes, checkIntervalSeconds]);
}
