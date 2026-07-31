import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, RefObject } from 'react';
import { convertLogicTreeToMermaid } from '../../_components/logicTreeToMermaid';
import { useScrollUtils } from '../_utils/scrollUtils';

/**
 * サマリーデータの型定義
 */
export type SummaryData = {
  logicTree: string;
  advice: string;
  summary: string;
  content: string;
  mermaidDiagram?: string;
};

/**
 * サマリーデータの取得と状態管理を行うカスタムフック
 * @param containerRef スクロールコンテナへの参照
 * @param topRef トップ要素への参照
 * @returns サマリーデータと関連状態・アクション
 */
export function useSummaryData(
  containerRef: RefObject<HTMLDivElement>
  //topRef: RefObject<HTMLDivElement>
) {
  // 基本データの状態管理
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ダイアグラム関連の状態管理
  const [mermaidDiagram, setMermaidDiagram] = useState<string>('');
  const [diagramError, setDiagramError] = useState<boolean>(false);
  const [diagramLoading, setDiagramLoading] = useState(true);

  // レイアウト関連の状態管理
  const [isStabilized, setIsStabilized] = useState(false);

  const router = useRouter();
  const svgRef = useRef<SVGElement | null>(null);

  // スクロールユーティリティの使用
  const { scrollToTop } = useScrollUtils(containerRef);

  // 新規チャットを開始する関数
  const startNewChat = () => {
    sessionStorage.removeItem('summaryData');
    router.push('/problem-solving-advisor');
  };

  // 初期ロード時の処理を改善
  useEffect(() => {
    if (summaryData && !isLoading && isInitialLoad) {
      // 初期レンダリング後に少し待機してからスクロール
      const timer = setTimeout(() => {
        scrollToTop();
        setIsInitialLoad(false);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [summaryData, isLoading, isInitialLoad, scrollToTop]);

  // コンポーネントマウント後にレイアウト安定化
  useEffect(() => {
    // 完全にレンダリングが終わった後に安定化フラグを設定
    const stabilizeTimer = setTimeout(() => {
      setIsStabilized(true);
    }, 1000);

    return () => clearTimeout(stabilizeTimer);
  }, []);

  // セッションストレージからデータを取得
  useEffect(() => {
    // ローディングタイムアウト設定
    const loadingTimeout = setTimeout(() => {
      if (diagramLoading) {
        setDiagramLoading(false);
      }
    }, 5000); // 5秒後に強制的にローディングを終了

    try {
      const data = sessionStorage.getItem('summaryData');
      if (data) {
        const parsedData = JSON.parse(data);
        setSummaryData(parsedData);

        // 事前変換済みのMermaidデータを使用
        if (parsedData.mermaidDiagram) {
          setMermaidDiagram(parsedData.mermaidDiagram);
          setDiagramError(false);
        } else {
          // フォールバック: データはあるが変換データがない場合のみ変換
          try {
            const diagram = convertLogicTreeToMermaid(parsedData.logicTree || '');
            setMermaidDiagram(diagram);
            setDiagramError(false);
          } catch (err) {
            console.error('ロジックツリー変換エラー:', err);
            setDiagramError(true);
            setDiagramLoading(false);
          }
        }
      } else {
        // データがなければエラー設定
        setError('まとめデータが見つかりませんでした');
        setDiagramLoading(false);
      }
    } catch (err) {
      console.error('Summary data parsing error:', err);
      setError('データの読み込みに失敗しました');
      setDiagramLoading(false);
    } finally {
      setIsLoading(false);
    }

    // クリーンアップ
    return () => {
      clearTimeout(loadingTimeout);
    };
  }, []);

  // ダイアグラムレンダリング完了時のハンドラ
  const handleDiagramRenderComplete = () => {
    // ダイアグラムのレンダリングが完了したことを確認するため、少し待機
    setTimeout(() => {
      // SVG要素を取得
      const svgElement = document.querySelector('.mermaid-diagram-container svg');
      if (svgElement) {
        // SVG参照を保存
        svgRef.current = svgElement as SVGElement;
      } else {
        console.error('SVG element not found in handleDiagramRenderComplete');
      }

      setDiagramLoading(false);
    }, 100);
  };

  // データ更新用のヘルパー関数
  const updateSummaryData = (updatedData: SummaryData) => {
    sessionStorage.setItem('summaryData', JSON.stringify(updatedData));
    setSummaryData(updatedData);
  };

  return {
    // 状態
    summaryData,
    setSummaryData: updateSummaryData,
    isLoading,
    error,
    isStabilized,
    mermaidDiagram,
    diagramError,
    diagramLoading,
    svgRef,

    // アクション
    setDiagramLoading,
    handleDiagramRenderComplete,
    scrollToTop,
    startNewChat,
  };
}
