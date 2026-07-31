'use client';

import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import PageLayout from '@/app/_components/layout/page-layout';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { useAppSelector } from '@/app/_store/hooks';
import { cn } from '@/app/_utils/tw-merge';
import CreateScheduleTitle from './_components/create-schedule-title';
import SchedulingFormArea from './_components/scheduling-form-area';
import ScheduleResultArea from './_components/scheduling-result-area';

export default function Page() {
  const { result } = useAppSelector((state) => state.createSchedule);
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(result);

  return (
    <PageLayout className="flex flex-col">
      <CreateScheduleTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex min-h-0 flex-1 gap-x-10 overflow-hidden">
        {/* スケジュール作成エリア */}
        {(isLeftOnly || isTwoColumns) && (
          <SchedulingFormArea
            switchLayout={switchLayout}
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px] min-h-0')}
          />
        )}
        {/* スケジュール作成結果エリア */}
        {(isRightOnly || isTwoColumns) && (
          <ScheduleResultArea className={cn('w-full  h-fullss', isTwoColumns && 'w-2/3 min-h-0')} />
        )}
      </div>
    </PageLayout>
  );
}
