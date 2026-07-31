import { useFormContext } from 'react-hook-form';
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
import { setReset } from '@/app/_store/slice/manual';
import { getMessage } from '@/app/_utils/message';
import { CreateManualSchema } from '../_utils/schema';

type Props = {
  onReset?: () => void;
};

export default function Title({ onReset }: Props) {
  const { reset } = useFormContext<CreateManualSchema>();
  const dispatch = useAppDispatch();

  const handleReset = () => {
    reset();
    dispatch(setReset()); // Reduxストアもリセット
    onReset?.(); // 親コンポーネントのコールバックを呼び出す
    toast.success(getMessage('I_F_00090'));
  };

  return (
    <div>
      <Heading level={3} className="flex items-center">
        <span className="mr-0.5">動画から簡単にマニュアル作成</span>
        <Help message="動画ファイルからマニュアルを作成する画面です。" className="mr-1.5" />
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
      </Heading>
    </div>
  );
}
