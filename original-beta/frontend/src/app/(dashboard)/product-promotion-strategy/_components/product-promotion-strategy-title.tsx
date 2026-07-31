import React from 'react';
import { useDispatch } from 'react-redux';
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
import { setReset } from '@/app/_store/slice/product-promotion-strategy';

export default function ProductPromotionStrategyTitle() {
  const dispatch = useDispatch();

  const handleReset = () => {
    try {
      // Reduxストアをリセット
      dispatch(setReset());

      // フォームリセットイベントを発行
      const resetEvent = new CustomEvent('product-promotion-strategy-form-reset', {
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
        拡販戦略作成
        <Help message="商品・サービスの効果的な拡販戦略を作成します。" />
      </Heading>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="link" size="link" onClick={handleReset} className="text-xs">
              情報をクリア
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>入出力内容を削除して新しく始める</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
