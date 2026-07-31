'use client';

import { toast } from 'sonner';
import SvgCopy from '@/app/_components/icon/button/Copy';
import SvgDownload from '@/app/_components/icon/button/Download';
import FeedbackBadButton from '@/app/_components/usecase/feedback-bad-button';
import FeedbackGoodButton from '@/app/_components/usecase/feedback-good-button';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setFeedbackAt } from '@/app/_store/slice/image-generation';
import { getMessage } from '@/app/_utils/message';
import { Button } from '../../../_components/ui/button';
import { Label } from '../../../_components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../_components/ui/tooltip';

type Props = {
  className?: string;
};

export default function ImageResultArea({ className }: Props) {
  const dispatch = useAppDispatch();
  const { id, feedbackAt } = useAppSelector((state) => state.imageGeneration);
  const { resultBase64, imageFormat } = useAppSelector((state) => ({
    resultBase64: state.imageGeneration.resultBase64,
    imageFormat: state.imageGeneration.format,
  }));

  const copyImage = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!resultBase64) return;

    // ClipboardItem未対応ブラウザのチェック
    if (typeof window.ClipboardItem === 'undefined') {
      toast.error('このブラウザは画像コピーに対応していません');
      return;
    }

    // Clipboard API 権限状態の確認
    if (navigator.permissions) {
      try {
        const permissionStatus = await navigator.permissions.query({
          name: 'clipboard-write' as PermissionName,
        });
        console.log('clipboard-write permission:', permissionStatus.state);
        if (permissionStatus.state === 'denied') {
          toast.error('クリップボード書き込み権限がありません');
          return;
        }
      } catch (e) {
        console.warn('clipboard-write permission check failed:', e);
      }
    }

    try {
      // データURLからbase64部分とMIMEタイプを抽出
      const match = /^data:(image\/\w+);base64,(.*)$/.exec(resultBase64);
      if (!match) throw new Error('Invalid image data');
      const mimeType = match[1];
      const base64Data = match[2];

      // 形式チェック（PNGのみ対応）
      if (mimeType !== 'image/png') {
        toast.error('この画像形式はクリップボードコピーに対応していません（PNGのみ対応）');
        return;
      }

      // 画像サイズチェック（例: 2MB以上は警告）
      const byteLength = Math.ceil((base64Data.length * 3) / 4); // base64→バイト数
      if (byteLength > 2 * 1024 * 1024) {
        toast.error('画像サイズが大きすぎてコピーできません（2MB以下推奨）');
        return;
      }

      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length)
        .fill(0)
        .map((_, i) => byteCharacters.charCodeAt(i));
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      await navigator.clipboard.write([new window.ClipboardItem({ [mimeType]: blob })]);
      toast.success(getMessage('I_F_00050', '画像コピー'));
    } catch (e) {
      toast.error('画像のコピーに失敗しました');
      // 詳細なエラーをコンソールに出力
      console.error('Clipboard copy error:', e);
    }
  };

  function downloadImage() {
    if (!resultBase64) return;
    const ext = imageFormat === 'jpeg' ? 'jpg' : imageFormat;
    const element = document.createElement('a');
    element.href = resultBase64;
    element.download = `生成画像.${ext}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  const handleSubmit = () => {
    dispatch(setFeedbackAt(new Date()));
  };

  return (
    <div className={className}>
      <div className="mb-1 flex min-h-8 items-end justify-between">
        <Label className="text-base">作成結果</Label>
        <div className="flex items-center">
          <FeedbackGoodButton
            source="image"
            messageId={id}
            isSubmitted={!!feedbackAt}
            handleSubmit={handleSubmit}
          />
          <FeedbackBadButton
            source="image"
            messageId={id}
            isSubmitted={!!feedbackAt}
            handleSubmit={handleSubmit}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="icon" size="icon" onClick={downloadImage}>
                  <SvgDownload className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>画像をダウンロード</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="icon"
                  size="icon"
                  onClick={copyImage}
                  className="ml-2"
                >
                  <SvgCopy className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>画像をコピー</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="relative flex h-full items-center justify-center">
        {resultBase64 ? (
          <img src={resultBase64} alt="生成画像" style={{ maxWidth: '100%', maxHeight: '400px' }} />
        ) : (
          <span className="text-base text-gray-400">画像がまだ生成されていません</span>
        )}
      </div>
    </div>
  );
}
