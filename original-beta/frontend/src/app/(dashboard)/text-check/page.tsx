'use client';

import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import { useUseCaseLayout } from '@/app/_hooks/use-text-layout';
import { useAppSelector } from '@/app/_store/hooks';
import { cn } from '@/app/_utils/tw-merge';
import PageLayout from '../../_components/layout/page-layout';
import TextCheckFormArea from './_components/text-check-form-area';
import TextCheckResults from './_components/text-check-result';
import TextCheckTitle from './_components/text-check-title';

export default function Layout() {
  const { evaluation } = useAppSelector((state) => state.textCheck);
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } =
    useUseCaseLayout(evaluation);

  return (
    <PageLayout className="flex flex-col">
      <TextCheckTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex min-h-0 flex-1 gap-x-10 overflow-hidden">
        {/* 文章の指摘ポイント作成エリア */}
        {(isLeftOnly || isTwoColumns) && (
          <TextCheckFormArea
            switchLayout={switchLayout}
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px] min-h-0')}
          />
        )}
        {/* 文章の指摘ポイント作成結果エリア */}
        {(isRightOnly || isTwoColumns) && (
          <TextCheckResults className={cn('w-full', isTwoColumns && 'w-2/3 min-h-0')} />
        )}
      </div>
    </PageLayout>
  );
}
