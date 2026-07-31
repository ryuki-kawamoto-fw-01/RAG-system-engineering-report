'use client';

import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { useAppSelector } from '@/app/_store/hooks';
import { cn } from '@/app/_utils/tw-merge';
import PageLayout from '../../_components/layout/page-layout';
import TextCorrectionForm from './_components/text-correction-form';
import TextCorrectionResults from './_components/text-correction-results';
import TextCorrectionTitle from './_components/text-correction-title';

export default function Layout() {
  const { correctedText } = useAppSelector((state) => state.textCorrection);
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } =
    useUseCaseLayout(correctedText);

  return (
    <PageLayout className="flex flex-col">
      <TextCorrectionTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex min-h-0 flex-1 gap-x-10 overflow-hidden">
        {/* 文章校正設定エリア */}
        {(isLeftOnly || isTwoColumns) && (
          <TextCorrectionForm
            switchLayout={switchLayout}
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px] min-h-0')}
          />
        )}
        {/* 文章校正結果エリア */}
        {(isRightOnly || isTwoColumns) && (
          <TextCorrectionResults className={cn('w-full', isTwoColumns && 'w-2/3 min-h-0')} />
        )}
      </div>
    </PageLayout>
  );
}
