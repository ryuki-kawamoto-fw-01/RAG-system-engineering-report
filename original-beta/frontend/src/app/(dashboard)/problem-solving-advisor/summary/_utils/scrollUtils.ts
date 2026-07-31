import { RefObject, useCallback } from 'react';

/**
 * スクロール関連のユーティリティを提供するカスタムフック
 * @param containerRef スクロールするコンテナへの参照
 * @returns スクロール関連の関数
 */
export function useScrollUtils(containerRef: RefObject<HTMLElement>) {
  /**
   * 指定した位置にスムーズにスクロールする関数
   * @param position スクロール先の位置
   */
  const smoothScroll = useCallback(
    (position: number) => {
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: position,
          behavior: 'auto', // smoothからautoに変更してリフローを減らす
        });
      }
    },
    [containerRef]
  );

  /**
   * ページトップにスクロールする関数
   */
  const scrollToTop = useCallback(() => {
    smoothScroll(0);
  }, [smoothScroll]);

  return {
    smoothScroll,
    scrollToTop,
  };
}

/**
 * スクロールイベントハンドラをセットアップする関数
 * @param container スクロールを監視する要素
 * @param callback スクロール停止時に実行するコールバック
 * @param delay スクロール停止とみなすまでの遅延時間（ms）
 * @returns クリーンアップ関数
 */
export function setupScrollHandler(
  container: HTMLElement,
  callback: () => void,
  delay: number = 50
): () => void {
  let scrollTimeout: NodeJS.Timeout;

  const handleScroll = () => {
    // スクロール中は何もしない
    clearTimeout(scrollTimeout);

    // スクロール停止後に少し待ってからコールバック実行
    scrollTimeout = setTimeout(callback, delay);
  };

  container.addEventListener('scroll', handleScroll, { passive: true });

  // クリーンアップ関数を返す
  return () => {
    clearTimeout(scrollTimeout);
    container.removeEventListener('scroll', handleScroll);
  };
}
