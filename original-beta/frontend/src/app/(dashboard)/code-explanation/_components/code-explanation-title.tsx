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
import { reset } from '@/app/_store/slice/code-explanation';

export default function CodeExplanationTitle(): JSX.Element {
  const dispatch = useAppDispatch();
  const handleReset = () => {
    dispatch(reset());
  };
  return (
    <div>
      <Heading level={3} className="flex items-center">
        <span className="mr-0.5">コードの解説</span>
        <Help
          message="指定されたプログラミング言語や製品のコードを分析し、その意味や機能を詳細に解説します。"
          className="mr-[6px]"
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="text" size="text-sm" onClick={handleReset}>
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
