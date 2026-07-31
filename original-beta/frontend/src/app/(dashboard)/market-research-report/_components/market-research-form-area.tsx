'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import React, { useRef } from 'react';
import { toast } from 'sonner';
import { LAYOUT_RIGHT_ONLY, LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { Form } from '../../../_components/ui/form';
import { useAppDispatch, useAppSelector } from '../../../_store/hooks';
import {
  setResult,
  setId,
  setIsCreated,
  setInitialValues,
} from '../../../_store/slice/market-research-report';
import { FixMarketReport } from '../_actions/fix-report';
import { marketresearchReport } from '../_actions/market-research-report';
import { MarketResearchReportSchema, marketresearchReportSchema } from '../_utils/schema';
import CompetitorForm from './competitor-form';
import ConsiderationForm from './consideration-form';
import MarketForm from './market-form';
import MarketResearchReportButton from './market-research-report-button';
import PurposeFormForm from './purpose-form';
import TargetCustomerForm from './target-customer-form';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function MarketResearchFormArea({ switchLayout, className }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result, feedbackAt, ...defaultValues } = useAppSelector(
    (state) => state.marketresearchReport
  );
  const dispatch = useAppDispatch();
  const form = useFormRedux<MarketResearchReportSchema>({
    resolver: zodResolver(marketresearchReportSchema),
    values: defaultValues,
  });
  const isCreated = useAppSelector((state) => state.marketresearchReport.isCreated);
  const reportId = useAppSelector((state) => state.marketresearchReport.id);
  const initialValues = useAppSelector((state) => state.marketresearchReport.initialValues);
  const previousValuesRef = useRef<MarketResearchReportSchema | null>(null);
  const [isFixing, setIsFixing] = React.useState(false);

  // isCreatedの状態を監視
  React.useEffect(() => {
    console.log('isCreated:', isCreated);
  }, [isCreated]);

  const handleMarketResearchReport = async (e: MarketResearchReportSchema) => {
    try {
      const id = uniqueId();
      const response = await marketresearchReport(
        id,
        e.market,
        e.competitor,
        e.target,
        e.purpose,
        e.consideration
      );
      previousValuesRef.current = { ...e };
      dispatch(setResult({ result: response.answer, feedbackAt: undefined }));
      dispatch(setId(id));
      dispatch(setInitialValues(e));
      toast.success(getMessage('I_F_00030', '作成結果'));
      switchLayout(LAYOUT_RIGHT_ONLY);
      dispatch(setIsCreated(true));
      console.log('setIsCreated(true) called');
      return response;
    } catch {
      toast.error(getMessage('E_F_00110', '作成結果'));
    }
  };

  // 修正依頼送信用の関数例
  const handleFixReport = async () => {
    setIsFixing(true);
    try {
      if (!reportId) {
        console.log('reportIdがnullです');
        return;
      }
      const currentValues = form.getValues();
      const previousValues = initialValues;
      if (!previousValues) {
        console.log('previousValuesがnullです');
        return;
      }
      console.log('previousValues:', previousValues);
      console.log('currentValues:', currentValues);
      console.log('result', result);

      const response = await FixMarketReport(
        reportId,
        result,
        previousValues.market,
        previousValues.competitor,
        previousValues.target,
        previousValues.purpose,
        currentValues.market,
        currentValues.competitor,
        currentValues.target,
        currentValues.purpose,
        previousValues.consideration,
        currentValues.consideration
      );
      dispatch(setInitialValues(currentValues));

      // 修正依頼の結果を作成結果として表示
      if ('answer' in response) {
        // 修正時は既存のフィードバック状態を保持する
        dispatch(setResult({ result: response.answer, feedbackAt }));
        // 必要ならトーストも
        toast.success('修正が完了しました');
      } else {
        toast.error(response.error || '修正でエラーが発生しました');
      }
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleMarketResearchReport)}
        className={cn('relative flex flex-col h-full', className)}
      >
        <div className="flex-1 space-y-3 overflow-y-auto pb-[48px]">
          {/* 調査する市場・分野入力フォーム */}
          <MarketForm />
          {/* 競合企業入力フォーム */}
          <CompetitorForm />
          {/* ターゲット顧客入力フォーム */}
          <TargetCustomerForm />
          {/* 調査の背景・目的入力フォーム */}
          <PurposeFormForm />
          {/* 考慮事項入力フォーム */}
          <ConsiderationForm />
          {/* レポート作成ボタン */}
          {!isCreated ? (
            <MarketResearchReportButton label="作成する" />
          ) : (
            <MarketResearchReportButton
              label="修正する"
              type="button"
              onClick={handleFixReport}
              disabled={form.formState.isSubmitting || isFixing}
              isLoading={isFixing}
            />
          )}
        </div>
      </form>
    </Form>
  );
}
