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
import { resetIncidentReport } from '@/app/_store/slice/incident-report';

// 労働災害報告書画面タイトル
export default function IncidentReportTitle(): JSX.Element {
  const dispatch = useAppDispatch();

  // リセット処理を内部で実装
  const handleReset = () => {
    try {
      // 労働災害報告書データをリセット
      dispatch(resetIncidentReport());

      // フォームリセットイベントを発行（カスタムイベント）
      const resetEvent = new CustomEvent('incident-report-form-reset', {
        bubbles: true,
        detail: { timestamp: new Date().getTime() },
      });
      window.dispatchEvent(resetEvent);

      setTimeout(() => {
        const delayedResetEvent = new CustomEvent('incident-report-form-reset', {
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
          労働災害報告書
        </Heading>
        <Help
          message="15項目を入力すると、労働災害報告書を自動作成する画面です。"
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
