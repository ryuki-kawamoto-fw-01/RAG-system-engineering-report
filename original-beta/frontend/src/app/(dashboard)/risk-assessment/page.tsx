'use client';

import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import PageLayout from '@/app/_components/layout/page-layout';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { useAppSelector } from '@/app/_store/hooks';
import { cn } from '@/app/_utils/tw-merge';
import RiskAssessmentFormArea from './_components/risk-assessment-form-area';
import RiskAssessmentResult from './_components/risk-assessment-result';
import RiskAssessmentTitle from './_components/risk-assessment-title';

export default function RiskAssessmentPage() {
  const { result } = useAppSelector((state) => state.riskAssessment);

  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(result);

  return (
    <PageLayout className="flex flex-col">
      <RiskAssessmentTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex flex-1 gap-x-10 overflow-hidden">
        {/* 入力エリア */}
        {(isLeftOnly || isTwoColumns) && (
          <RiskAssessmentFormArea
            switchLayout={switchLayout}
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px]')}
          />
        )}
        {/* リスク評価作成結果エリア */}
        {(isRightOnly || isTwoColumns) && (
          <RiskAssessmentResult className={cn('w-full', isTwoColumns && 'w-2/3')} />
        )}
      </div>
    </PageLayout>
  );
}
