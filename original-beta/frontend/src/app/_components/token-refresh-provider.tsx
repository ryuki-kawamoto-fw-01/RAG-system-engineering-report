'use client';

import { useTokenRefresh } from '../_hooks/useTokenRefresh';

const REFRESH_CONFIG = {
  tokenLifetimeMinutes: 60, // トークンの有効期限（分）
  refreshThresholdMinutes: 15, // リフレッシュする残り時間（分）
  checkIntervalSeconds: 60, // チェック間隔（秒）
};

export function TokenRefreshProvider({ children }: { children: React.ReactNode }) {
  useTokenRefresh(
    REFRESH_CONFIG.tokenLifetimeMinutes,
    REFRESH_CONFIG.refreshThresholdMinutes,
    REFRESH_CONFIG.checkIntervalSeconds
  );

  return <>{children}</>;
}
