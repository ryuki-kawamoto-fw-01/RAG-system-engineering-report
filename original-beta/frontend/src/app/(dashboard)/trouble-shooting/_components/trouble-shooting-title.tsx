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

import { setReset } from '@/app/_store/slice/trouble-shooting';
import { getMessage } from '@/app/_utils/message';

export default function TroubleShootingTitle() {
  const dispatch = useAppDispatch();
  const handleReset = () => {
    dispatch(setReset());
    toast.success(getMessage('I_F_00090'));
  };
  return (
    <div className="flex items-center">
      <Heading level={3} className="mr-0.5">
        トラブルシューティングガイドの作成
      </Heading>
      <Help
        message="製品やシステムの一般的な問題点を特定し、各問題に対する解決方法を調査・整理して、ユーザーが簡単に参照できる体系的なトラブルシューティングガイドを作成します。"
        className="mr-1.5"
      />
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
