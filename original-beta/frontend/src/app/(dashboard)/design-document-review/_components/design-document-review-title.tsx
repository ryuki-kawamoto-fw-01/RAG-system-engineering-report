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
import { setReset } from '@/app/_store/slice/design-document-review';
import { getMessage } from '@/app/_utils/message';

export default function DesignDocumentReviewTitle() {
  const dispatch = useAppDispatch();
  const handleReset = () => {
    dispatch(setReset());
    toast.success(getMessage('I_F_00090'));
  };

  return (
    <div>
      <Heading level={3} className="flex items-center">
        <span className="mr-0.5">設計書のレビュー</span>
        <Help
          message="新製品の設計書を専門的な視点で分析し、詳細なフィードバックと改善提案を提供します。"
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
      </Heading>
    </div>
  );
}
