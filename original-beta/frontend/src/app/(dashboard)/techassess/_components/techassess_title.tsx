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
import { useAppDispatch } from '@/app/_store/hooks';
import { resetTechassess } from '@/app/_store/slice/techassess';

// 技術評価レポート画面タイトル
export default function TechassessTitle(): JSX.Element {
  const dispatch = useAppDispatch();

  // リセット処理を内部で実装
  const handleReset = () => {
    try {
      // 技術評価レポートデータをリセット
      dispatch(resetTechassess());

      // フォームリセットイベントを発行（カスタムイベント）
      const resetEvent = new CustomEvent('techassess-form-reset', {
        bubbles: true,
        detail: { timestamp: new Date().getTime() },
      });
      window.dispatchEvent(resetEvent);

      setTimeout(() => {
        const delayedResetEvent = new CustomEvent('techassess-form-reset', {
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
      <div className="flex items-center">
        <Heading level={3} className="mr-0.5">
          技術評価レポート
        </Heading>
        <Help
          message="6項目を入力すると、技術評価レポートを自動作成する画面です。"
          className="mr-1.5"
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="link" size="link" className="text-xs" onClick={handleReset}>
                情報をクリア
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>入出力内容を削除して新しく始める</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
