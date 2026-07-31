'use client';

import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import PageLayout from '@/app/_components/layout/page-layout';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { useAppSelector } from '@/app/_store/hooks';
import { cn } from '@/app/_utils/tw-merge';
import QualityReportFormArea from './_components/quality-report-form-area';
import QualityReportResultArea from './_components/quality-report-result-area';
import QualityReportTitle from './_components/quality-report-title';

export default function QualityReportPage() {
  const { result } = useAppSelector((state) => state.qualityReport);
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(result);

  return (
    <PageLayout className="flex flex-col">
      <QualityReportTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex min-h-0 flex-1 gap-x-10 overflow-hidden">
        {/* 品質管理レポート作成エリア */}
        {(isLeftOnly || isTwoColumns) && (
          <QualityReportFormArea
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px] min-h-0')}
            switchLayout={switchLayout}
          />
        )}
        {/* 品質管理レポート結果エリア */}
        {(isRightOnly || isTwoColumns) && (
          <QualityReportResultArea className={cn('w-full', isTwoColumns && 'w-2/3 min-h-0')} />
        )}
      </div>
    </PageLayout>
  );
}
