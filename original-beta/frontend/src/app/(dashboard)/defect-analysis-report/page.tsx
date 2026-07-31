'use client';

import LayoutSwitchButton from '../../_components/common-usecase/layout-switch-button';
import PageLayout from '../../_components/layout/page-layout';
import { useUseCaseLayout } from '../../_hooks/use-usecase-layout';
import { useAppSelector } from '../../_store/hooks';
import { cn } from '../../_utils/tw-merge';
import AnalysisDisplay from './_components/analysis-display';
import DefectAnalysisFormArea from './_components/defect-analysis-form-area';
import DefectTitle from './_components/defect-title';

export default function DefectAnalysisReportPage() {
  const { result } = useAppSelector((state) => state.defectAnalysisReport);
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(result);

  return (
    <PageLayout className="flex flex-col">
      <DefectTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex min-h-0 flex-1 gap-x-10 overflow-hidden">
        {/* 不具合分析フォームエリア */}
        {(isLeftOnly || isTwoColumns) && (
          <DefectAnalysisFormArea
            switchLayout={switchLayout}
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px] min-h-0')}
          />
        )}
        {/* 分析結果エリア */}
        {(isRightOnly || isTwoColumns) && (
          <AnalysisDisplay className={cn('w-full', isTwoColumns && 'w-2/3 min-h-0')} />
        )}
      </div>
    </PageLayout>
  );
}
