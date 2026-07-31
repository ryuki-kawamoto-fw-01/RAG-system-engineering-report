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
import { setReset } from '../../../_store/slice/key-point-extraction';

export default function KeyPointExtractionTitle(): JSX.Element {
  const dispatch = useAppDispatch();
  const handleReset = () => {
    dispatch(setReset());
    toast.success(getMessage('I_F_00090'));
  };

  return (
    <Heading level={3} className="flex items-center">
      <span className="mr-0.5">文章の要点抽出</span>
      <Help message="指定された文章の要点を簡潔に箇条書きでまとめる画面です。" className="mr-1.5" />
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
  );
}
