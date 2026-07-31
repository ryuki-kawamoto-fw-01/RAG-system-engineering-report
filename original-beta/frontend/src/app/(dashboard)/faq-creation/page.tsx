'use client';

import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { useAppSelector } from '@/app/_store/hooks';
import { cn } from '@/app/_utils/tw-merge';
import PageLayout from '../../_components/layout/page-layout';
import FaqInputFormArea from './_components/faq-input-form-area';
import FaqResultDisplay from './_components/faq-result';
import FaqTitle from './_components/faq-title';

export default function FaqCreationPage() {
  const { faqResult } = useAppSelector((state) => state.faqCreation);
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } =
    useUseCaseLayout(faqResult);
  return (
    <PageLayout className="flex flex-col">
      <FaqTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex min-h-0 flex-1 gap-x-10 overflow-hidden">
        {(isLeftOnly || isTwoColumns) && (
          <FaqInputFormArea
            switchLayout={switchLayout}
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px] min-h-0')}
          />
        )}
        {(isRightOnly || isTwoColumns) && (
          <FaqResultDisplay className={cn('w-full', isTwoColumns && 'w-2/3 min-h-0')} />
        )}
      </div>
    </PageLayout>
  );
}
