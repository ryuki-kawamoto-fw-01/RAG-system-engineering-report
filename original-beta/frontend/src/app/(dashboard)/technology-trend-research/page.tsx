'use client';

import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import PageLayout from '@/app/_components/layout/page-layout';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { useAppSelector } from '@/app/_store/hooks';
import { cn } from '@/app/_utils/tw-merge';
import ReportCreationResult from './_components/report-creation-result';
import TechnologyTrendResearchTitle from './_components/technology-trend-research-title';
import TrendResearchFormArea from './_components/trend-research-form-area';

export default function Layout() {
  const { result } = useAppSelector((state) => state.technologytrendResearch);
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(result);

  return (
    <PageLayout className="flex flex-col">
      <TechnologyTrendResearchTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex min-h-0 flex-1 gap-x-10 overflow-hidden">
        {/* レポート作成エリア */}
        {(isLeftOnly || isTwoColumns) && (
          <TrendResearchFormArea
            switchLayout={switchLayout}
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px] min-h-0')}
          />
        )}
        {/* レポート作成結果エリア */}
        {(isRightOnly || isTwoColumns) && (
          <ReportCreationResult className={cn('w-full', isTwoColumns && 'w-2/3 min-h-0')} />
        )}
      </div>
    </PageLayout>
  );
}
