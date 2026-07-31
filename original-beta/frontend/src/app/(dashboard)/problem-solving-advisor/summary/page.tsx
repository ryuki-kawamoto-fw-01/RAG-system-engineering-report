'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/app/_components/ui/button';
import PageLayout from '../../../_components/layout/page-layout';

// ユーティリティのインポート
import { useSummaryData } from './_actions/summaryDataActions';

// コンポーネントのインポート
import AdviceSection from './_components/AdviceSection';
import LogicTreeSection from './_components/LogicTreeSection';
import ScrollToTopButton from './_components/ScrollToTopButton';
import SummarySection from './_components/SummarySection';
import { setupScrollHandler } from './_utils/scrollUtils';

export default function SummaryPage() {
  // コンテナへの参照
  const topRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // サマリーデータの取得と状態管理
  const {
    summaryData,
    setSummaryData,
    isLoading,
    error,
    isStabilized,
    mermaidDiagram,
    diagramError,
    diagramLoading,
    svgRef,
    handleDiagramRenderComplete,
    scrollToTop,
    startNewChat,
  } = useSummaryData(containerRef);

  // スクロールイベントリスナーの追加
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // setupScrollHandler関数を使用
    const cleanup = setupScrollHandler(container, () => {
      // 空のコマンドだが、ブラウザにリフローを強制
      void container.offsetHeight;
    });

    return cleanup;
  }, [isStabilized]);

  // グローバルCSSを追加するuseEffect
  useEffect(() => {
    // 既存のスタイルタグを探す
    const existingStyle = document.getElementById('mermaid-fix-styles');
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = 'mermaid-fix-styles';
      style.textContent = `
        /* SVG要素のスタイリング - 動的サイズに戻す */
        .mermaid-diagram-container svg {
          width: auto;
          height: auto;
          overflow: visible;
        }
        /* Mermaidのバージョン表示を非表示 */
        .mermaid-version, [id*="mermaid-error"] {
          display: none !important;
        }
        /* スクロールコンテナの最適化 */
        .scroll-container {
          will-change: transform;
          transform: translateZ(0);
          backface-visibility: hidden;
        }
        /* 固定位置要素の最適化 */
        .fixed-element {
          will-change: transform;
          transform: translateZ(0);
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="text-lg">読み込み中...</div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center text-red-600">
            <div className="text-lg">{error}</div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!summaryData) {
    return null;
  }

  // CSS クラス名を最適化
  const containerClassName = `h-[calc(100vh-80px)] w-full overflow-y-auto overscroll-none py-4 pl-4 pr-0 ${
    isStabilized ? 'scroll-container' : ''
  }`;

  return (
    <PageLayout>
      {/* スクロールトップボタン */}
      <ScrollToTopButton onClick={scrollToTop} />

      <div ref={containerRef} className={containerClassName}>
        <div className="mx-auto max-w-5xl">
          <div ref={topRef} />

          {/* ロジックツリーセクション */}
          <LogicTreeSection
            logicTree={summaryData.logicTree}
            mermaidDiagram={mermaidDiagram}
            diagramError={diagramError}
            diagramLoading={diagramLoading}
            svgRef={svgRef}
            handleDiagramRenderComplete={handleDiagramRenderComplete}
          />
        </div>

        <div className="mx-auto max-w-5xl">
          {/* アドバイスセクション */}
          <AdviceSection
            summaryData={summaryData}
            setSummaryData={setSummaryData}
            containerRef={containerRef}
          />
        </div>

        <div className="mx-auto max-w-5xl">
          {/* まとめセクション */}
          <SummarySection
            summaryData={summaryData}
            setSummaryData={setSummaryData}
            containerRef={containerRef}
          />
        </div>

        {/* 新規チャットボタンを追加 */}
        <div className="mb-20 flex justify-center">
          <Button
            onClick={startNewChat}
            className="mt-4 bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            新規チャットを始める
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
