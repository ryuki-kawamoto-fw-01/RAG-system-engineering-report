import { toast } from 'sonner';
import { Button } from '@/app/_components/ui/button';
import Heading from '@/app/_components/ui/heading';
import Help from '@/app/_components/ui/help';
import { useAppDispatch } from '@/app/_store/hooks';
import { getMessage } from '@/app/_utils/message';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../_components/ui/tooltip';
import { setClearInfo } from '../../../_store/slice/defect-analysis-report';

export default function DefectTitle(): JSX.Element {
  const dispatch = useAppDispatch();
  const handleReset = () => {
    dispatch(setClearInfo());
    toast.success(getMessage('I_F_00090'));
  };

  return (
    <div className="flex items-center">
      <Heading level={3} className="mr-1.5 flex items-center gap-x-[2px]">
        不具合分析レポート
        <Help message="製品の不具合を分析してレポートを作成する画面です。" />
      </Heading>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={handleReset}>
              情報をクリア
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>入力内容をクリアします</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
