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
import { setReset } from '../../../_store/slice/create-technology-proposal';

export default function CreateTechnologyProposalTitle(): JSX.Element {
  const dispatch = useAppDispatch();
  const handleReset = () => {
    dispatch(setReset());
    toast.success(getMessage('I_F_00090'));
  };

  return (
    <div className="flex items-center">
      <Heading level={3} className="mr-0.5">
        新技術導入提案書の作成
      </Heading>
      <Help
        message="製造業界における新技術導入のメリット、導入プロセス、リスク管理、期待される成果を明確にした提案書を作成する画面です。"
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
