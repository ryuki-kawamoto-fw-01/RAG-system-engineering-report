'use client';

import { TokenRefreshProvider } from '../_components/token-refresh-provider';

/**
 * ダッシュボードのクライアントコンポーネントレイアウト
 * Server ComponentとClient Componentを分離するためのラッパー
 */
export default function DashboardClientLayout({ children }: { children: React.ReactNode }) {
  return <TokenRefreshProvider>{children}</TokenRefreshProvider>;
}
