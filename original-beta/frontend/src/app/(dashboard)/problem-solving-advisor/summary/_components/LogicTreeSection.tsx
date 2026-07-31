import { useState, RefObject } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import SvgCopy from '@/app/_components/icon/button/Copy';
import SvgDownload from '@/app/_components/icon/button/Download';
import { Button } from '@/app/_components/ui/button';
import { Label } from '@/app/_components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/_components/ui/tooltip';
import { getMessage } from '@/app/_utils/message';
import MermaidDiagram from '../../_components/MermaidDiagram';
import { formatLogicTree } from '../_utils/formatters';
import { copyImageToClipboard, downloadImage } from '../_utils/svgExport';

type LogicTreeSectionProps = {
  logicTree: string;
  mermaidDiagram: string;
  diagramError: boolean;
  diagramLoading: boolean;
  svgRef: RefObject<SVGElement>;
  handleDiagramRenderComplete: () => void;
};

export default function LogicTreeSection({
  logicTree,
  mermaidDiagram,
  diagramError,
  diagramLoading,
  svgRef,
  handleDiagramRenderComplete,
}: LogicTreeSectionProps) {
  const [isCopying, setIsCopying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // クリップボードにコピーする関数
  const copyToClipboard = async () => {
    setIsCopying(true);

    try {
      // SVG要素を取得（保存した参照を優先して使用）
      const svgElement = svgRef.current || document.querySelector('.mermaid-diagram-container svg');

      if (!svgElement) {
        throw new Error('SVG element not found');
      }

      // ユーティリティ関数を使用してコピー
      await copyImageToClipboard(
        svgElement,
        () => {
          toast.success(getMessage('I_F_00050', 'ロジックツリー'));
        },
        (error) => {
          console.error('クリップボードへのコピーに失敗しました:', error);
          toast.error(getMessage('E_F_00170', 'ロジックツリー'));
        }
      );
    } catch (error) {
      console.error('図のコピーに失敗しました:', error);
      toast.error(getMessage('E_F_00170', 'ロジックツリー'));
    } finally {
      setIsCopying(false);
    }
  };

  // 画像としてダウンロードする関数
  const downloadAsImage = async () => {
    setIsDownloading(true);

    try {
      // SVG要素を取得（保存した参照を優先して使用）
      const svgElement = svgRef.current || document.querySelector('.mermaid-diagram-container svg');

      if (!svgElement) {
        throw new Error('SVG element not found');
      }

      // ユーティリティ関数を使用してダウンロード
      await downloadImage(
        svgElement,
        'logic-tree.png',
        () => {
          toast.success(getMessage('I_F_00130', 'ロジックツリー'));
        },
        (error) => {
          console.error('ロジックツリーのダウンロードに失敗しました:', error);
          toast.error(getMessage('E_F_00360', 'ロジックツリー'));
        }
      );
    } catch (error) {
      console.error('ロジックツリーのダウンロードに失敗しました:', error);
      toast.error(getMessage('E_F_00360', 'ロジックツリー'));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="mb-3">
      <div className="mb-1 ">
        <Label className="text-base">ロジックツリー</Label>
      </div>

      {/* ロジックツリーのコンテナに相対位置指定 */}
      <div className="relative rounded-lg bg-white p-6 shadow-default">
        {/* ボタンを枠外右上に絶対位置指定で配置 */}
        {!diagramLoading && !diagramError && mermaidDiagram && (
          <>
            <div className="absolute -top-8 right-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="sm"
                      variant="icon"
                      onClick={downloadAsImage}
                      disabled={isDownloading}
                    >
                      <SvgDownload className="size-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      ロジックツリーをPNG画像として
                      <br />
                      ダウンロード
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="absolute right-3 top-3 z-10">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="icon"
                      size="icon"
                      onClick={copyToClipboard}
                      disabled={isCopying}
                    >
                      <SvgCopy className="size-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>ロジックツリーをクリップボードにコピー</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </>
        )}

        {diagramError ? (
          <div className="prose prose-sm max-h-[500px] max-w-none overflow-y-auto">
            <ReactMarkdown>{formatLogicTree(logicTree)}</ReactMarkdown>
          </div>
        ) : diagramLoading ? (
          <div className="flex h-[550px] items-center justify-center">
            <div className="animate-pulse text-center">
              <div className="text-lg">ロジックツリーを生成中...</div>
            </div>
          </div>
        ) : mermaidDiagram ? (
          <div
            className="relative max-h-[600px] overflow-auto overscroll-none"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <div className="mermaid-diagram-container min-w-fit">
              <MermaidDiagram
                chart={mermaidDiagram}
                className="w-full"
                onRenderComplete={handleDiagramRenderComplete}
              />
            </div>
          </div>
        ) : (
          <div className="prose prose-sm max-h-[500px] max-w-none overflow-y-auto">
            <ReactMarkdown>{logicTree}</ReactMarkdown>
          </div>
        )}

        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-600">テキスト表示</summary>
          <div className="prose prose-sm mt-2 max-h-[500px] max-w-none overflow-y-auto">
            <ReactMarkdown>{formatLogicTree(logicTree)}</ReactMarkdown>
          </div>
        </details>
      </div>
    </div>
  );
}
