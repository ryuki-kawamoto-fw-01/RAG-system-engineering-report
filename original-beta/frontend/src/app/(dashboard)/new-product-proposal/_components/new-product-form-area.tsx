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
} from '../../../_store/slice/new-product-proposal';
import { FixProductProposal } from '../_actions/fix-proposal';
import { newproductProposal } from '../_actions/new-product-proposal';
import { NewProductProposalSchema, newproductProposalSchema } from '../_utils/schema';
import ComparisonPointsForm from './comparison-points-form';
import ConceptFormForm from './concept-form';
import ConsiderationForm from './consideration-form';
import NewProductProposalButton from './new-product-proposal-button';
import ProductMarketForm from './product-market-form';
import ProductNameForm from './product-name-form';
import TargetCustomerForm from './target-customer-form';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function NewProductFormArea({ switchLayout, className }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result, ...defaultValues } = useAppSelector((state) => state.newproductProposal);
  const dispatch = useAppDispatch();
  const form = useFormRedux<NewProductProposalSchema>({
    resolver: zodResolver(newproductProposalSchema),
    values: defaultValues,
  });
  const isCreated = useAppSelector((state) => state.newproductProposal.isCreated);
  const reportId = useAppSelector((state) => state.newproductProposal.id);
  const initialValues = useAppSelector((state) => state.newproductProposal.initialValues);
  const previousValuesRef = useRef<NewProductProposalSchema | null>(null);
  const [isFixing, setIsFixing] = React.useState(false);

  // isCreatedの状態を監視
  React.useEffect(() => {
    console.log('isCreated:', isCreated);
  }, [isCreated]);

  const handleNewProductProposal = async (e: NewProductProposalSchema) => {
    try {
      console.log('submit', e);
      const id = uniqueId();
      const response = await newproductProposal(
        id,
        e.name,
        e.market,
        e.target,
        e.concept,
        e.comparisonPoints,
        e.consideration
      );
      previousValuesRef.current = { ...e };
      dispatch(setResult(response.answer));
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

      const response = await FixProductProposal(
        reportId,
        result,
        previousValues.name,
        previousValues.market,
        previousValues.target,
        previousValues.concept,
        previousValues.comparisonPoints,
        currentValues.name,
        currentValues.market,
        currentValues.target,
        currentValues.concept,
        currentValues.comparisonPoints,
        previousValues.consideration,
        currentValues.consideration
      );
      dispatch(setInitialValues(currentValues));

      // 修正依頼の結果を作成結果として表示
      if ('answer' in response) {
        dispatch(setResult(response.answer));
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
        onSubmit={form.handleSubmit(handleNewProductProposal)}
        className={cn('relative flex flex-col h-full', className)}
      >
        <div className="flex-1 space-y-3 overflow-y-auto pb-[48px]">
          {/* 製品名入力フォーム */}
          <ProductNameForm />
          {/* 新製品の市場入力フォーム */}
          <ProductMarketForm />
          {/* ターゲット顧客入力フォーム */}
          <TargetCustomerForm />
          {/* 新製品のコンセプト入力フォーム */}
          <ConceptFormForm />
          {/* 他社製品と比較したポイント入力フォーム */}
          <ComparisonPointsForm />
          {/* 考慮事項入力フォーム */}
          <ConsiderationForm />
          {/* レポート作成ボタン */}
          {!isCreated ? (
            <NewProductProposalButton label="作成する" />
          ) : (
            <NewProductProposalButton
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
