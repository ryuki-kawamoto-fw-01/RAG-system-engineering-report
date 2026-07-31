'use client';

import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { useAppSelector } from '@/app/_store/hooks';
import { cn } from '@/app/_utils/tw-merge';
import PageLayout from '../../_components/layout/page-layout';
import NewProductFormArea from './_components/new-product-form-area';
import NewProductProposalResult from './_components/new-product-proposal-result';
import NewProductProposalTitle from './_components/new-product-proposal-title';

export default function Layout() {
  const { result } = useAppSelector((state) => state.createIdea);
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(result);

  return (
    <PageLayout className="flex flex-col">
      <NewProductProposalTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex min-h-0 flex-1 gap-x-10 overflow-hidden">
        {/* レポート作成エリア */}
        {(isLeftOnly || isTwoColumns) && (
          <NewProductFormArea
            switchLayout={switchLayout}
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px] min-h-0')}
          />
        )}
        {/* レポート作成結果エリア */}
        {(isRightOnly || isTwoColumns) && (
          <NewProductProposalResult className={cn('w-full', isTwoColumns && 'w-2/3 min-h-0')} />
        )}
      </div>
    </PageLayout>
  );
}
