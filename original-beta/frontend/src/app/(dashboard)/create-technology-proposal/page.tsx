'use client';

import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { useAppSelector } from '@/app/_store/hooks';
import { cn } from '@/app/_utils/tw-merge';
import PageLayout from '../../_components/layout/page-layout';
import CreateTechnologyProposalTitle from './_components/create-technology-proposal-title';
import TechnologyProposalFormArea from './_components/technology-proposal-form-area';
import TechnologyProposalResults from './_components/technology-proposal-results';

export default function Layout() {
  const { result } = useAppSelector((state) => state.createTechnologyProposal);
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(result);

  return (
    <PageLayout className="flex flex-col">
      <CreateTechnologyProposalTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex min-h-0 flex-1 gap-x-10 overflow-hidden">
        {/* 新技術導入提案書の作成エリア */}
        {(isLeftOnly || isTwoColumns) && (
          <TechnologyProposalFormArea
            switchLayout={switchLayout}
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px] min-h-0')}
          />
        )}
        {/* 新技術導入提案書の作成作成結果エリア */}
        {(isRightOnly || isTwoColumns) && (
          <TechnologyProposalResults
            switchLayout={switchLayout}
            className={cn('w-full', isTwoColumns && 'w-2/3 min-h-0')}
          />
        )}
      </div>
    </PageLayout>
  );
}
