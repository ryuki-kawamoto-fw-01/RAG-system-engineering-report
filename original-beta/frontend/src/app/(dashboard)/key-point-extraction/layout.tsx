'use client';

import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { useAppSelector } from '@/app/_store/hooks';
import { cn } from '@/app/_utils/tw-merge';
import PageLayout from '../../_components/layout/page-layout';
import KeyPointExtractionForm from './_components/key-point-extraction-form';
import KeyPointExtractionResults from './_components/key-point-extraction-results';
import KeyPointExtractionTitle from './_components/key-point-extraction-title';

export default function Layout() {
  const { keyPointExtractionResult } = useAppSelector((state) => state.keyPointExtraction);
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } =
    useUseCaseLayout(keyPointExtractionResult);

  return (
    <PageLayout className="flex flex-col">
      <KeyPointExtractionTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex min-h-0 flex-1 gap-x-10 overflow-hidden">
        {/* 設定エリア */}
        {(isLeftOnly || isTwoColumns) && (
          <KeyPointExtractionForm
            switchLayout={switchLayout}
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px] min-h-0')}
          />
        )}
        {/* 結果エリア */}
        {(isRightOnly || isTwoColumns) && (
          <KeyPointExtractionResults className={cn('w-full', isTwoColumns && 'w-2/3 min-h-0')} />
        )}
      </div>
    </PageLayout>
  );
}
