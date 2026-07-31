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
import { setReset, setResult } from '../../../_store/slice/crisis-management-scenarios';

export default function CrisisManagementScenariosTitle(): JSX.Element {
  const dispatch = useAppDispatch();
  const handleReset = () => {
    dispatch(setReset());
    dispatch(setResult({ result: '', feedbackAt: undefined }));
    toast.success(getMessage('I_F_00090'));
  };

  return (
    <div className="flex items-center">
      <Heading level={3} className="mr-0.5">
        危機管理シナリオの作成
      </Heading>
      <Help
        message="未だ想定されていない新たなリスクを特定し、それに対する予防策と発生時の対応策を含む具体的な危機管理シナリオを作成する画面です。"
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
