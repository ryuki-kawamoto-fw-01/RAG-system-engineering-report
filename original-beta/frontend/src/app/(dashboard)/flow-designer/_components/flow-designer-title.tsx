import React from 'react';
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
import { setReset } from '@/app/_store/slice/flow-designer';

export default function FlowDesignerTitle() {
  const dispatch = useAppDispatch();

  const handleReset = () => {
    try {
      // Reduxストアをリセット
      dispatch(setReset());

      // フォームリセットイベントを発行
      const resetEvent = new CustomEvent('flow-designer-form-reset', {
        bubbles: true,
        detail: { timestamp: new Date().getTime() },
      });
      window.dispatchEvent(resetEvent);

      toast.success('入出力情報を削除しました');
    } catch (error) {
      console.error('リセット処理中にエラーが発生しました:', error);
      toast.error('入出力情報の削除中にエラーが発生しました');
    }
  };

  return (
    <div className="flex items-center">
      <Heading level={3} className="mr-1.5 flex items-center gap-x-[2px]">
        工程管理表の作成
        <Help message="製造工程の詳細を入力することで、FMEA形式やQC工程表などの工程管理表を自動生成する画面です" />
      </Heading>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="link" size="link" onClick={handleReset} className="text-xs">
              情報をクリア
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>入力内容をリセット</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
