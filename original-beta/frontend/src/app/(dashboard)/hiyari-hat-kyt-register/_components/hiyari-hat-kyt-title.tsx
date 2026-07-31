import { toast } from 'sonner';
import { Button } from '@/app/_components/ui/button';
import Heading from '@/app/_components/ui/heading';
import Help from '@/app/_components/ui/help';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/_components/ui/tooltip';

// ヒヤリハット登録画面タイトル
export default function HiyariHatKytTitle(): JSX.Element {
  // リセット処理を内部で実装
  const handleReset = () => {
    try {
      // フォームリセットイベントを発行（カスタムイベント）
      const resetEvent = new CustomEvent('hiyari-hat-kyt-form-reset', {
        bubbles: true,
        detail: { timestamp: new Date().getTime() },
      });
      window.dispatchEvent(resetEvent);

      setTimeout(() => {
        const delayedResetEvent = new CustomEvent('hiyari-hat-kyt-form-reset', {
          bubbles: true,
          detail: { timestamp: new Date().getTime(), delayed: true },
        });
        window.dispatchEvent(delayedResetEvent);
      }, 100);

      toast.success('入出力情報を削除しました');
    } catch (error) {
      console.error('リセット処理中にエラーが発生しました:', error);
      toast.error('入出力情報の削除中にエラーが発生しました');
    }
  };

  return (
    <div>
      <Heading level={3} className="flex items-center">
        <span className="mr-0.5">ヒヤリハット登録画面</span>
        <Help
          message="上記機能にてヒヤリハットを作成するためのもとになる情報を登録する画面です。"
          className="mr-[6px]"
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="text" size="text-sm" onClick={handleReset}>
                情報をクリア
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>入出力内容を削除して新しく始める</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Heading>
    </div>
  );
}
