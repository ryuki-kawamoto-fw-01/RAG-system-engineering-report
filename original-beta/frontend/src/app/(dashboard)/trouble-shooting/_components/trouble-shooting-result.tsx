import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import SvgCopy from '@/app/_components/icon/button/Copy';
import { Button } from '@/app/_components/ui/button';
import { Label } from '@/app/_components/ui/label';
import Markdown from '@/app/_components/ui/markdown';
import { Textarea } from '@/app/_components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/_components/ui/tooltip';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setResult } from '@/app/_store/slice/trouble-shooting';
import { cn } from '@/app/_utils/tw-merge';
import ActionButtons from './action-buttons';

type Props = {
  className?: string;
};

export default function TroubleShootingResult({ className }: Props): JSX.Element {
  const dispatch = useAppDispatch();
  const { result } = useAppSelector((state) => state.troubleShootingGuide);
  const [preEditResult, setPreEditResult] = useState('');
  useEffect(() => {
    setPreEditResult(result);
  }, [result]);
  const [isEditing, setIsEditing] = useState(false);
  const copyResult = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); // デフォルトのフォーム送信動作を防ぐ
    navigator.clipboard.writeText(result);
    toast.success('作成結果をクリップボードにコピーしました');
  };
  const handleEdit = () => {
    setIsEditing(true);
  };
  const handleCancel = () => {
    setPreEditResult(result);
    setIsEditing(false);
  };

  const handleSave = () => {
    dispatch(setResult(preEditResult));
    setIsEditing(false);
  };

  const handleDownload = () => {
    const text = preEditResult;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    // ダウンロード用のリンクを作成してクリック
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trouble-shooting-guide.txt'; // ファイル名
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // メモリ解放
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="mb-1 flex min-h-8 items-end justify-between">
        <Label className="text-base">作成結果</Label>
        <ActionButtons
          isEditing={isEditing}
          handleEdit={handleEdit}
          handleCancel={handleCancel}
          handleSave={handleSave}
          handleDownload={handleDownload}
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
                onClick={copyResult}
                className="absolute right-1 top-1 z-10"
              >
                <SvgCopy className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>コピー</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {result.length === 0 || isEditing ? (
          <Textarea
            onChange={(e) => {
              setPreEditResult(e.target.value);
              setResult(e.target.value);
            }}
            value={preEditResult}
            className="h-full resize-none p-3"
            readOnly={!isEditing}
            placeholder="ここに生成されたトラブルシューティングガイドが表示されます"
          />
        ) : (
          <Markdown className="h-full resize-none overflow-auto rounded-lg border bg-white p-3 shadow">
            {result}
          </Markdown>
        )}
      </div>
    </div>
  );
}
