'use client';

import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { useAppSelector } from '@/app/_store/hooks';
import { cn } from '@/app/_utils/tw-merge';
import PageLayout from '../../_components/layout/page-layout';
import TechnologyTrainingTitle from './_components/technology-training-title';
import TrainingFormArea from './_components/training-form-area';
import TrainingPlanResults from './_components/training-plan-results';

export default function Layout() {
  const { result } = useAppSelector((state) => state.technologyTraining);
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(result);

  return (
    <PageLayout className="flex flex-col">
      <TechnologyTrainingTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex min-h-0 flex-1 gap-x-10 overflow-hidden">
        {/* トレーニング計画作成エリア */}
        {(isLeftOnly || isTwoColumns) && (
          <TrainingFormArea
            switchLayout={switchLayout}
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px] min-h-0')}
          />
        )}
        {/* トレーニング計画作成結果エリア */}
        {(isRightOnly || isTwoColumns) && (
          <TrainingPlanResults className={cn('w-full', isTwoColumns && 'w-2/3 min-h-0')} />
        )}
      </div>
    </PageLayout>
  );
}
