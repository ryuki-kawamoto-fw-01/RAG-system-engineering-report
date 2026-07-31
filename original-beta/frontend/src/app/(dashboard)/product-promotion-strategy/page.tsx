'use client';

import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';

import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import PageLayout from '@/app/_components/layout/page-layout';
import { LAYOUT_RIGHT_ONLY } from '@/app/_constants/common-usecase';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { setLoading, setResult, setId } from '@/app/_store/slice/product-promotion-strategy';
import type { RootState } from '@/app/_store/store';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { sendProductPromotionStrategyRequest } from './_actions/sendProductPromotionStrategyRequest';
import ProductPromotionStrategyFormArea from './_components/form-area';
import ProductPromotionStrategyTitle from './_components/product-promotion-strategy-title';
import ProductPromotionStrategyResult from './_components/result-display';
import type { ProductPromotionStrategyRequest } from './_store/types';

export default function ProductPromotionStrategyPage() {
  const dispatch = useDispatch();
  const { result } = useSelector((state: RootState) => state.productPromotionStrategy);
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(result);

  const handleSubmit = async (data: ProductPromotionStrategyRequest) => {
    try {
      dispatch(setLoading(true));
      const id = uniqueId();
      const response = await sendProductPromotionStrategyRequest(id, data);
      dispatch(setResult({ result: response.strategy, feedbackAt: undefined }));
      dispatch(setId(id));
      toast.success(getMessage('I_F_00030', '拡販戦略'));
      switchLayout(LAYOUT_RIGHT_ONLY);
    } catch (error) {
      console.error('Failed to generate product promotion strategy:', error);
      toast.error(getMessage('E_F_00110', '拡販戦略'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <PageLayout className="flex flex-col">
      <ProductPromotionStrategyTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex flex-1 gap-x-10 overflow-hidden">
        {/* フォームエリア */}
        {(isLeftOnly || isTwoColumns) && (
          <ProductPromotionStrategyFormArea
            onSubmit={handleSubmit}
            switchLayout={switchLayout}
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px]')}
          />
        )}
        {/* 結果表示エリア */}
        {(isRightOnly || isTwoColumns) && (
          <ProductPromotionStrategyResult className={cn('w-full', isTwoColumns && 'w-2/3')} />
        )}
      </div>
    </PageLayout>
  );
}
