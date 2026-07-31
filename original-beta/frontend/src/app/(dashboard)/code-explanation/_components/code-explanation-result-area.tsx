'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import SvgCopy from '@/app/_components/icon/button/Copy';
import { Button } from '@/app/_components/ui/button';
import { Label } from '@/app/_components/ui/label';
import { Textarea } from '@/app/_components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/_components/ui/tooltip';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setResult } from '@/app/_store/slice/code-explanation';
import { cn } from '@/app/_utils/tw-merge';
import ActionButtons from './action-buttons';

type Props = {
  className?: string;
};
export default function CodeExplanationResultArea({ className }: Props) {
  const dispatch = useAppDispatch();
  const { result } = useAppSelector((state) => state.codeExplanation);
  const [editableResult, setEditableResult] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  useEffect(() => {
    setEditableResult(result);
  }, [result]);
  const copyResult = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); // デフォルトのフォーム送信動作を防ぐ
    navigator.clipboard.writeText(result);
    toast.success('作成結果をクリップボードにコピーしました');
  };
  const handleEdit = () => {
    setIsEditing(true);
  };
  const handleCancel = () => {
    setEditableResult(result);
    setIsEditing(false);
  };

  const handleSave = () => {
    dispatch(setResult(editableResult));
    setIsEditing(false);
  };

  const handleDownload = () => {
    const text = editableResult;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    // ダウンロード用のリンクを作成してクリック
    const a = document.createElement('a');
    a.href = url;
    a.download = 'code-explanation.txt'; // ファイル名
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
        <Textarea
          value={editableResult}
          onChange={(e) => setEditableResult(e.target.value)}
          className="h-full"
          readOnly={!isEditing}
          placeholder="ここに生成されたコードの解説が表示されます"
        />
      </div>
    </div>
  );
}
