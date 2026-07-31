'use client';

import mermaid from 'mermaid';
import { useEffect, useRef, useState } from 'react';

type MermaidDiagramProps = {
  chart: string;
  className?: string;
  onRenderComplete?: () => void; // レンダリング完了通知用コールバック
  onSvgRendered?: (svgString: string) => void; // SVGデータを親コンポーネントに渡すコールバック
};

type CurveType =
  | 'step'
  | 'linear'
  | 'basis'
  | 'bumpX'
  | 'bumpY'
  | 'cardinal'
  | 'catmullRom'
  | 'monotoneX'
  | 'monotoneY'
  | 'natural'
  | 'stepAfter'
  | 'stepBefore'
  | undefined;

// 拡張FlowchartConfig型を定義
interface ExtendedFlowchartConfig {
  useMaxWidth: boolean;
  htmlLabels: boolean;
  curve: CurveType;
  rankSpacing: number;
  nodeSpacing: number;
  ranker: 'tight-tree' | 'longest-path';
}

export default function MermaidDiagram({
  chart,
  className = '',
  onRenderComplete,
  onSvgRendered,
}: MermaidDiagramProps) {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  // コールバックが呼び出されたかを追跡
  const callbackCalledRef = useRef(false);

  // グローバルCSSを追加してバージョン表示とエラーメッセージを非表示にする
  useEffect(() => {
    // 既存のスタイルタグを探す
    const existingStyle = document.getElementById('mermaid-style-fix');
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = 'mermaid-style-fix';
      style.textContent = `
        .mermaid-version, .error, [id*="mermaid-error"] {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    // コンポーネントがマウントされるたびにリセット
    callbackCalledRef.current = false;

    if (!chart || chart.trim() === '') {
      // チャートがなければ即座にコールバック実行
      if (onRenderComplete && !callbackCalledRef.current) {
        callbackCalledRef.current = true;
        onRenderComplete();
      }
      return;
    }

    // タイムアウト設定を追加 - 3秒後に強制的にコールバック実行
    const safetyTimeout = setTimeout(() => {
      if (onRenderComplete && !callbackCalledRef.current) {
        callbackCalledRef.current = true;
        onRenderComplete();
      }
    }, 3000);

    // Mermaidを初期化（一度だけ）
    if (!isInitialized) {
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          securityLevel: 'loose',
          logLevel: 5,
          flowchart: {
            useMaxWidth: false,
            htmlLabels: true,
            curve: 'basis',
            rankSpacing: 30,
            nodeSpacing: 20,
            ranker: 'tight-tree', // 高速なレイアウトアルゴリズム
          } as unknown as ExtendedFlowchartConfig,
        });
        setIsInitialized(true);
      } catch (error) {
        console.error('Mermaid初期化エラー:', error);
        // 初期化失敗時もコールバック実行
        if (onRenderComplete && !callbackCalledRef.current) {
          callbackCalledRef.current = true;
          onRenderComplete();
        }
      }
    }

    // レンダリング処理をマイクロタスクキューに移動して非同期処理の信頼性を向上
    setTimeout(() => {
      const renderDiagram = async () => {
        if (!mermaidRef.current) {
          // ref がなければコールバック実行
          if (onRenderComplete && !callbackCalledRef.current) {
            callbackCalledRef.current = true;
            onRenderComplete();
          }
          return;
        }

        try {
          // 前回のレンダリング結果をクリア
          mermaidRef.current.innerHTML = '';

          // 一意のID生成
          const id = 'mermaid-diagram-' + Math.random().toString(36).substring(2, 15);

          // チャートの妥当性を事前チェック
          await mermaid.parse(chart);

          // レンダリング
          const { svg } = await mermaid.render(id, chart);

          // コンポーネントがまだマウントされているか確認
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg;

            // 念のためバージョン表示とエラー要素を削除
            const elementsToRemove = mermaidRef.current.querySelectorAll(
              '.mermaid-version, .error, [id*="mermaid-error"]'
            );
            elementsToRemove.forEach((el) => el.remove());

            // SVGデータを親コンポーネントに渡す
            if (onSvgRendered) {
              onSvgRendered(svg);
            }
          }

          // レンダリング完了を通知
          if (onRenderComplete && !callbackCalledRef.current) {
            callbackCalledRef.current = true;
            onRenderComplete();
          }
        } catch (error) {
          console.error('Mermaid解析エラー:', error);
          // エラー時も要素を空にする
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = '';
          }
          // エラー時も完了を通知
          if (onRenderComplete && !callbackCalledRef.current) {
            callbackCalledRef.current = true;
            onRenderComplete();
          }
        }
      };

      // チャートデータの変更時にレンダリング
      renderDiagram();
    }, 0);

    // クリーンアップ関数
    return () => {
      clearTimeout(safetyTimeout);
      // アンマウント時にもコールバックを実行（まだ実行されていなければ）
      if (onRenderComplete && !callbackCalledRef.current) {
        callbackCalledRef.current = true;
        onRenderComplete();
      }
    };
  }, [chart, isInitialized, onRenderComplete, onSvgRendered]);

  return <div ref={mermaidRef} className={className} />;
}
