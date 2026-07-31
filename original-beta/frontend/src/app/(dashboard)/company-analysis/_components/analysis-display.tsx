import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import SvgCopy from '@/app/_components/icon/button/Copy';
import { Button } from '@/app/_components/ui/button';
import { Label } from '@/app/_components/ui/label';
import Markdown from '@/app/_components/ui/markdown';
import { ScrollArea } from '@/app/_components/ui/scroll-area';
import { Textarea } from '@/app/_components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/_components/ui/tooltip';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setResult } from '@/app/_store/slice/company-analysis';
import { getMessage } from '@/app/_utils/message';
import ActionButtons from './action-buttons';

type Props = {
  className?: string;
};

export default function AnalysisDisplay({ className }: Props): JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [editableResult, setEditableResult] = useState('');
  const dispatch = useAppDispatch();

  const { result, feedbackAt } = useAppSelector((state) => state.companyAnalysis);

  useEffect(() => {
    setEditableResult(result);
  }, [result]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editableResult);
    toast.success(getMessage('I_F_00050', '分析結果'));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditableResult(result);
    setIsEditing(false);
  };

  const handleSave = () => {
    dispatch(setResult({ result: editableResult, feedbackAt }));
    setIsEditing(false);
  };

  return (
    <div className={className}>
      <div className="mb-1 flex min-h-8 items-end justify-between">
        <Label className="text-base">分析結果</Label>
        <ActionButtons
          isEditing={isEditing}
          handleEdit={handleEdit}
          handleCancel={handleCancel}
          handleSave={handleSave}
        />
      </div>
      <div className="relative mb-3 grow overflow-auto">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="icon"
                onClick={handleCopy}
                className="absolute right-1 top-1 z-10"
              >
                <SvgCopy className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>コピー</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {isEditing ? (
          <Textarea
            value={editableResult}
            onChange={(e) => setEditableResult(e.target.value)}
            className="size-full"
          />
        ) : (
          <ScrollArea className="size-full rounded-lg border bg-white px-4 py-2 shadow">
            {result ? (
              <Markdown>{result.replace(/<\/?b>/g, '**')}</Markdown>
            ) : (
              <span className="text-base text-gray-400">
                ここに生成された企業分析が表示されます
                <br />
                複数の分析手法を選択した場合、出力に数分かかる場合があります
              </span>
            )}
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
