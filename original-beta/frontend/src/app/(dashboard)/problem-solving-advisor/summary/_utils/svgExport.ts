/**
 * SVG要素を画像に変換する関数
 * @param svg 変換するSVG要素
 * @returns Canvasオブジェクトを含むPromise
 */
export function convertSvgToImage(svg: SVGElement): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    try {
      // SVG要素のクローンを作成して操作
      const svgForExport = svg.cloneNode(true) as SVGElement;

      // SVGの初期サイズを取得
      const svgRect = svg.getBoundingClientRect();

      // クローンに明示的なサイズを設定
      svgForExport.setAttribute('width', '1200');
      svgForExport.setAttribute('height', '600');

      // viewBoxが既にある場合は保持、なければ設定
      if (!svgForExport.getAttribute('viewBox')) {
        // getBoundingClientRect()で取得したサイズよりも、固定値を使用
        svgForExport.setAttribute('viewBox', '0 0 1200 600');
      }

      // SVGデータをXML文字列に変換
      const svgData = new XMLSerializer().serializeToString(svgForExport);

      // スタイル情報を保持する安全なサニタイズ
      const sanitizedSvgData = svgData
        .replace(/<\?xml.*\?>/g, '')
        .replace(
          /<svg/g,
          '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"'
        )
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      // クラス属性と Mermaid 特有の属性は保持
      // スタイル属性も保持

      // キャンバスの準備
      const canvas = document.createElement('canvas');
      // 初期サイズを大きめに設定
      canvas.width = svgRect.width * 2;
      canvas.height = svgRect.height * 2;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Canvas context not available'));
      }

      // 背景を白に設定（透明部分対策）
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 内部画像要素
      const img = new Image();
      img.crossOrigin = 'anonymous';

      // 成功ハンドラー
      img.onload = () => {
        // 高解像度対応
        const scale = 2;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        // 背景を白に設定（再設定）
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 画像を描画
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);

        resolve(canvas);
      };

      // エラーハンドラー
      img.onerror = (e) => {
        console.error('Image loading failed:', e);

        // Base64エンコード方式を試す
        try {
          const base64SVG = btoa(unescape(encodeURIComponent(sanitizedSvgData)));
          const dataUrl = `data:image/svg+xml;base64,${base64SVG}`;
          img.src = dataUrl;
        } catch (base64Error) {
          console.error('Base64 method failed:', base64Error);

          // インラインSVG方式を試す
          try {
            const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(sanitizedSvgData)}`;
            img.src = dataUrl;
          } catch (inlineError) {
            console.error('Inline SVG method failed:', inlineError);
            reject(new Error('All SVG conversion methods failed'));
          }
        }
      };

      // ForeignObject方式を最初に試す
      try {
        // SVGをHTMLドキュメント内に配置
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        tempDiv.innerHTML = sanitizedSvgData;
        document.body.appendChild(tempDiv);

        // 描画されたSVGを取得
        setTimeout(() => {
          try {
            const renderedSvg = tempDiv.querySelector('svg');
            if (renderedSvg) {
              // クラス属性と特定のスタイルを保持するようにする
              const svgElements = renderedSvg.querySelectorAll('*');
              svgElements.forEach((el) => {
                // fill属性が設定されていないノードに白色を設定
                if (!el.hasAttribute('fill') && el.nodeName !== 'svg') {
                  // デフォルトで黒になる要素（rect, path, polygon等）に白を設定
                  if (['rect', 'path', 'polygon', 'circle', 'ellipse'].includes(el.nodeName)) {
                    el.setAttribute('fill', 'white');
                  }
                }
              });

              const renderedSvgData = new XMLSerializer().serializeToString(renderedSvg);
              document.body.removeChild(tempDiv);

              // Data URL方式を使用
              const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderedSvgData)}`;
              img.src = dataUrl;
            } else {
              document.body.removeChild(tempDiv);
              // Blob URLを試す
              const blob = new Blob([sanitizedSvgData], { type: 'image/svg+xml' });
              const url = URL.createObjectURL(blob);

              img.onload = () => {
                URL.revokeObjectURL(url);

                // 高解像度対応
                const scale = 2;
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;

                // 背景を白に設定
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 画像を描画
                ctx.scale(scale, scale);
                ctx.drawImage(img, 0, 0);

                resolve(canvas);
              };

              img.onerror = () => {
                URL.revokeObjectURL(url);
                // 通常のData URL方式にフォールバック
                const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sanitizedSvgData)}`;
                img.src = dataUrl;
              };

              img.src = url;
            }
          } catch (tempError) {
            if (document.body.contains(tempDiv)) {
              document.body.removeChild(tempDiv);
            }
            console.error('ForeignObject method failed:', tempError);

            // 通常のData URL方式にフォールバック
            const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sanitizedSvgData)}`;
            img.src = dataUrl;
          }
        }, 100);
      } catch (foreignObjectError) {
        console.error('ForeignObject setup failed:', foreignObjectError);

        // 通常のData URL方式にフォールバック
        const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sanitizedSvgData)}`;
        img.src = dataUrl;
      }
    } catch (error) {
      console.error('SVG conversion error:', error);
      reject(error);
    }
  });
}

/**
 * SVGをクリップボードにコピーする関数
 * @param svgElement コピーするSVG要素
 * @param onSuccess 成功時のコールバック
 * @param onError エラー時のコールバック
 */
export async function copyImageToClipboard(
  svgElement: SVGElement,
  onSuccess: () => void,
  onError: (error: Error) => void
) {
  try {
    // ブラウザのクリップボードAPIをチェック
    if (!navigator.clipboard || !navigator.clipboard.write) {
      throw new Error('Clipboard API not supported in this browser');
    }

    // SVGをCanvasに変換
    const canvas = await convertSvgToImage(svgElement);

    // Canvasを画像に変換してクリップボードにコピー
    canvas.toBlob(
      async (blob) => {
        if (blob) {
          try {
            // Clipboard APIを使用してコピー
            const item = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);
            onSuccess();
          } catch (error) {
            onError(
              error instanceof Error ? error : new Error('クリップボードへのコピーに失敗しました')
            );
          }
        } else {
          onError(new Error('画像の生成に失敗しました'));
        }
      },
      'image/png',
      1.0
    );
  } catch (error) {
    onError(error instanceof Error ? error : new Error('図のコピーに失敗しました'));
  }
}

/**
 * SVGを画像としてダウンロードする関数
 * @param svgElement ダウンロードするSVG要素
 * @param filename ダウンロードするファイル名
 * @param onSuccess 成功時のコールバック
 * @param onError エラー時のコールバック
 */
export async function downloadImage(
  svgElement: SVGElement,
  filename: string,
  onSuccess: () => void,
  onError: (error: Error) => void
) {
  try {
    // SVGをCanvasに変換
    const canvas = await convertSvgToImage(svgElement);

    // ダウンロードリンクを作成
    const link = document.createElement('a');
    link.download = filename;

    // Canvasをデータ URL に変換
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          link.href = url;
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 100);
          onSuccess();
        } else {
          onError(new Error('画像の生成に失敗しました'));
        }
      },
      'image/png',
      1.0
    );
  } catch (error) {
    onError(error instanceof Error ? error : new Error('図のダウンロードに失敗しました'));
  }
}
