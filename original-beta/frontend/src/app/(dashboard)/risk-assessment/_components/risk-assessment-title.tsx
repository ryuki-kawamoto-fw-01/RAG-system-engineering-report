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
import { setReset } from '@/app/_store/slice/risk-assessment';
import { getMessage } from '@/app/_utils/message';

export default function RiskAssessmentTitle() {
  const dispatch = useAppDispatch();
  const handleReset = () => {
    dispatch(setReset());
    toast.success(getMessage('I_F_00090'));
  };
  return (
    <div className="flex items-center">
      <Heading level={3} className="mr-0.5">
        リスクアセスメントシートの作成
      </Heading>
      <Help
        message="製造現場の情報を収集・分析し、厚生労働省のガイドラインに基づいた具体的なリスク評価と対策を含む、実用的なリスクアセスメントシートを表形式で作成します。"
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
