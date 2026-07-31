'use client';

import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { useAppSelector } from '@/app/_store/hooks';
import { selectProductComparison } from '@/app/_store/selectors/product-comparison';
import { cn } from '@/app/_utils/tw-merge';
import PageLayout from '../../_components/layout/page-layout';
import ProductComparisonFormArea from './_components/product-comparison-form-area';
import ProductComparisonResultArea from './_components/product-comparison-result-area';
import ProductComparisonTitle from './_components/product-comparison-title';

export default function ProductComparisonPage() {
  const { ProductComparisonResult } = useAppSelector(selectProductComparison);

  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } =
    useUseCaseLayout(ProductComparisonResult);

  return (
    <PageLayout className="flex flex-col">
      <ProductComparisonTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />

      <div className="flex flex-1 gap-x-10 overflow-hidden">
        {/* 入力エリア - レイアウトに応じて表示/非表示 */}
        {(isLeftOnly || isTwoColumns) && (
          <ProductComparisonFormArea
            switchLayout={switchLayout}
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px]')}
          />
        )}

        {/* 結果表示エリア - 結果がある場合のみ表示 */}
        {(isRightOnly || isTwoColumns) && (
          <ProductComparisonResultArea className={cn('w-full', isTwoColumns && 'w-2/3')} />
        )}
      </div>
    </PageLayout>
  );
}
