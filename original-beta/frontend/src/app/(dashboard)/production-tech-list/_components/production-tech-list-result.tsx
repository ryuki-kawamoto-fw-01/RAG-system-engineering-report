'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import SvgCopy from '@/app/_components/icon/button/Copy';
import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '@/app/_components/ui/button';
import { Label } from '@/app/_components/ui/label';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/_components/ui/tooltip';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setResult } from '@/app/_store/slice/production-tech-list';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { reanalysis } from '../_actions/reanalysis';
import ActionButtons from './action-buttons';

type Props = {
  className?: string;
};

export default function ProductionTechListResult({ className }: Props) {
  const dispatch = useAppDispatch();
  const { answer, feedbackAt } = useAppSelector((state) => state.productionTechList);

  const [isEditing, setIsEditing] = useState(false);
  const [resultEditProductionTechList, setResultEditProductionTechList] = useState(answer);

  // ★ 追加: 再分析リクエスト用の状態
  const [NewProductionTechRequest, setNewProductionTechRequest] = useState('');
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  useEffect(() => {
    setResultEditProductionTechList(answer);
  }, [answer]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(answer);
    toast.success(getMessage('I_F_00050', '洗い出し結果'));
  };

  const handleSave = () => {
    dispatch(setResult({ answer: resultEditProductionTechList, feedbackAt }));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setResultEditProductionTechList(answer);
    setIsEditing(false);
  };

  // ★ 追加: 再分析ボタン押下時の処理
  const { id } = useAppSelector((state) => state.productionTechList);
  const handleReanalysis = async () => {
    if (!NewProductionTechRequest.trim()) {
      toast.error('再洗い出し内容を入力してください');
      return;
    }
    setIsReanalyzing(true);
    try {
      // 必要なパラメータを渡してAPIを呼ぶ（propsやidなどは実際の設計に合わせてください）
      const response = await reanalysis({
        id, // 実際のIDを指定
        result: resultEditProductionTechList,
        newProductionTechRequest: NewProductionTechRequest,
      });
      if ('answer' in response) {
        dispatch(setResult({ answer: response.answer, feedbackAt: undefined }));
        toast.success('再洗い出しが完了しました');
        setNewProductionTechRequest('');
      } else {
        toast.error(response.error || '再洗い出しに失敗しました');
      }
    } catch {
      toast.error('再洗い出し中にエラーが発生しました');
    } finally {
      setIsReanalyzing(false);
    }
  };

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="mb-1 flex min-h-8 items-end justify-between">
        <Label className="text-base">洗い出し結果</Label>
        <ActionButtons
          isEditing={isEditing}
          handleEdit={handleEdit}
          handleCancel={handleCancel}
          handleSave={handleSave}
        />
      </div>
      <div className="relative h-full">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="icon"
                size="icon"
                onClick={handleCopy}
                className="absolute right-1 top-1 z-10"
              >
                <SvgCopy className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>コピー</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Textarea
          outerClass="h-full"
          className="h-full resize-none"
          name="answer"
          value={resultEditProductionTechList}
          placeholder="ここに生成された洗い出し結果が表示されます"
          readOnly={!isEditing}
          onChange={(e) => setResultEditProductionTechList(e.target.value)}
        />
      </div>

      <div className="relative mt-4 flex h-48 flex-col">
        <RequiredLabel>洗い出し結果を調整する</RequiredLabel>
        <Textarea
          value={NewProductionTechRequest}
          onChange={(e) => setNewProductionTechRequest(e.target.value)}
          onBlur={(e) => {
            setNewProductionTechRequest(e.target.value);
          }}
          placeholder="洗い出し結果を調整するための指示を入力してください。\n例：成型技術に絞る"
          className="size-full min-h-[100px] resize-none"
        />
        <Button
          type="button"
          variant="secondary"
          disabled={isReanalyzing || !NewProductionTechRequest.trim()}
          onClick={handleReanalysis}
          className="absolute bottom-0 left-1/2 w-full max-w-[180px] -translate-x-1/2"
        >
          {isReanalyzing ? (
            <>
              <Spinner className="mr-2 size-6 animate-spin" />
              再洗い出し中です
            </>
          ) : (
            '再洗い出しする'
          )}
        </Button>
      </div>
    </div>
  );
}
