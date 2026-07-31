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
import { setReset } from '@/app/_store/slice/source-code-creation';
import { getMessage } from '@/app/_utils/message';

export default function SourceCodeCreationTitle() {
  const dispatch = useAppDispatch();
  const handleReset = () => {
    dispatch(setReset());
    toast.success(getMessage('I_F_00090'));
  };

  return (
    <div className="flex items-center">
      <Heading level={3} className="mr-1.5 flex items-center gap-x-[2px]">
        ソースコード作成
        <Help message="チャット形式でソースコードを作成する画面です。" />
      </Heading>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="link"
              size="link"
              onClick={handleReset}
              className="text-xs"
            >
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
