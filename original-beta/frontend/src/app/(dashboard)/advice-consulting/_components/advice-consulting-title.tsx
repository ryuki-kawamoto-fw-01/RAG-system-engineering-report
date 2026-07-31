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
import { setReset } from '@/app/_store/slice/advice-consulting';
import { getMessage } from '@/app/_utils/message';

export default function AdviceConsultingTitle() {
  const dispatch = useAppDispatch();
  const handleReset = () => {
    dispatch(setReset());
    toast.success(getMessage('I_F_00090'));
  };

  return (
    <div className="flex items-center">
      <Heading level={3} className="mr-0.5">
        アドバイス（コンサルティング）
      </Heading>
      <Help
        message="役割と制約を指定して、専門的なコンサルティングアドバイスを取得する画面です"
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
            <p>入力内容をクリアし、新しいアドバイス（コンサルティング）を開始します</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
