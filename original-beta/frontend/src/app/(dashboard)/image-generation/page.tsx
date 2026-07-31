'use client';

import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { useAppSelector } from '@/app/_store/hooks';
import { cn } from '@/app/_utils/tw-merge';
import PageLayout from '../../_components/layout/page-layout';
import ImageFormArea from './_components/image-form-area';
import ImageGenerationTitle from './_components/image-generation-title';
import ImageResult from './_components/image-result';

export default function Layout() {
  const { result } = useAppSelector((state) => state.createIdea);
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(result);

  return (
    <PageLayout className="flex flex-col">
      <ImageGenerationTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex flex-1 gap-x-10 overflow-hidden">
        {/* 画像生成エリア */}
        {(isLeftOnly || isTwoColumns) && (
          <ImageFormArea
            switchLayout={switchLayout}
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px]')}
          />
        )}
        {/* 画像生成結果エリア */}
        {(isRightOnly || isTwoColumns) && (
          <ImageResult className={cn('w-full', isTwoColumns && 'w-2/3')} />
        )}
      </div>
    </PageLayout>
  );
}
