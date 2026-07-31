'use client';

import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { useAppSelector } from '@/app/_store/hooks';
import { cn } from '@/app/_utils/tw-merge';
import PageLayout from '../../_components/layout/page-layout';
import InputFormArea from './_components/input-form-area';
import TroubleShootingResult from './_components/trouble-shooting-result';
import TroubleShootingTitle from './_components/trouble-shooting-title';

export default function Layout() {
  const { result } = useAppSelector((state) => state.troubleShootingGuide);
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(result);

  return (
    <PageLayout className="flex flex-col">
      <TroubleShootingTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex min-h-0 flex-1 gap-x-10 overflow-hidden">
        {/* 入力エリア */}
        {(isLeftOnly || isTwoColumns) && (
          <InputFormArea
            switchLayout={switchLayout}
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px] min-h-0')}
          />
        )}
        {/* 結果エリア */}
        {(isRightOnly || isTwoColumns) && (
          <TroubleShootingResult className={cn('w-full', isTwoColumns && 'w-2/3 min-h-0')} />
        )}
      </div>
    </PageLayout>
  );
}
