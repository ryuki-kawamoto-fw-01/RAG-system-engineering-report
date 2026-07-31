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
import { setReset } from '@/app/_store/slice/taskBreakdown';
import { getMessage } from '@/app/_utils/message';

export default function TaskBreakdownTitle() {
  const dispatch = useAppDispatch();
  const handleReset = () => {
    dispatch(setReset());
    toast.success(getMessage('I_F_00090'));
  };

  return (
    <div>
      <Heading level={3} className="flex items-center">
        <span className="mr-0.5">業務のタスク分解</span>
        <Help
          message={
            '指定された業務を主要要素ごとに分解し、\n優先順位や具体的アクションを整理します。'
          }
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
      </Heading>
    </div>
  );
}
