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
import { setReset, setResult } from '../../../_store/slice/create-design-document';

export default function DesignDocumentTitle(): JSX.Element {
  const dispatch = useAppDispatch();
  const handleReset = () => {
    dispatch(setReset());
    dispatch(setResult(''));
    toast.success(getMessage('I_F_00090'));
  };

  return (
    <div className="flex items-center">
      <Heading level={3} className="mr-0.5">
        設計書の作成
      </Heading>
      <Help
        message="入力した製品仕様に基づき、製造業向けの詳細な設計書を体系的に作成する画面です。"
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
