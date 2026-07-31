'use client';

import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import PageLayout from '@/app/_components/layout/page-layout';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { useAppSelector } from '@/app/_store/hooks';
import { cn } from '@/app/_utils/tw-merge';
import AdviceConsultingFormArea from './_components/advice-consulting-form-area';
import AdviceConsultingResults from './_components/advice-consulting-results';
import AdviceConsultingTitle from './_components/advice-consulting-title';

export default function Page() {
  const { result } = useAppSelector((state) => state.adviceConsulting);
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(result);

  return (
    <PageLayout className="flex flex-col">
      <AdviceConsultingTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex min-h-0 flex-1 gap-x-10 overflow-hidden">
        {/* 入力エリア */}
        {(isLeftOnly || isTwoColumns) && (
          <AdviceConsultingFormArea
            switchLayout={switchLayout}
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px] min-h-0')}
          />
        )}
        {/* 出力エリア */}
        {(isRightOnly || isTwoColumns) && (
          <AdviceConsultingResults className={cn('w-full', isTwoColumns && 'w-2/3 min-h-0')} />
        )}
      </div>
    </PageLayout>
  );
}
