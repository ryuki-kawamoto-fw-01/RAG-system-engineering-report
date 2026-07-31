import { toast } from 'sonner';
import { Button } from '@/app/_components/ui/button';
import Heading from '@/app/_components/ui/heading';
import Help from '@/app/_components/ui/help';
import { useAppDispatch } from '@/app/_store/hooks';
import { setReset } from '@/app/_store/slice/talk-script';
import { getMessage } from '@/app/_utils/message';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../_components/ui/tooltip';

export default function TalkScriptTitle(): JSX.Element {
  const dispatch = useAppDispatch();
  const handleReset = () => {
    dispatch(setReset());
    toast.success(getMessage('I_F_00090'));
  };

  return (
    <div className="flex items-center">
      <Heading level={3} className="mr-0.5">
        トークスクリプト
      </Heading>
      <Help
        message="提案書の内容を読み取って提案書を説明する際の台本を作成する画面です。"
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
