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
import { getMessage } from '@/app/_utils/message';

type AdvisorTitleProps = {
  onReset?: () => void;
  isDisabled?: boolean;
};

export default function AdvisorTitle({ onReset, isDisabled = false }: AdvisorTitleProps) {
  const handleReset = () => {
    if (onReset && !isDisabled) {
      onReset();
      toast.success(getMessage('I_F_00090'));
    }
  };

  return (
    <div className="flex items-center">
      <Heading level={3} className="mr-1.5">
        課題解決アドバイザー
      </Heading>
      <Help
        message="課題に対して、原因を分析してアドバイスを生成する画面です。"
        className="mr-1.5"
      />
      {onReset && (
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
      )}
    </div>
  );
}
