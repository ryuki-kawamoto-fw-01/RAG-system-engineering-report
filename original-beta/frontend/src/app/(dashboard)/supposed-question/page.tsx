'use client';

import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { useAppSelector } from '@/app/_store/hooks';
import { cn } from '@/app/_utils/tw-merge';
import PageLayout from '../../_components/layout/page-layout';
import SupposedQuestionCreateForm from './_components/supposed-question-create-form';
import SupposedQuestionModifyForm from './_components/supposed-question-modify-form';
import SupposedQuestionResult from './_components/supposed-question-result';
import SupposedQuestionTitle from './_components/supposed-question-title';

export default function SupposedQuestionPage() {
  const { result } = useAppSelector((state) => state.supposedQuestion);
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(result);

  return (
    <PageLayout className="flex flex-col">
      <SupposedQuestionTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex min-h-0 flex-1 gap-x-10 overflow-hidden">
        {(isLeftOnly || isTwoColumns) && (
          <SupposedQuestionCreateForm
            switchLayout={switchLayout}
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px] min-h-0')}
          />
        )}
        {(isRightOnly || isTwoColumns) && (
          <div className={cn('size-full relative', isTwoColumns && 'w-2/3 min-h-0')}>
            <div className="h-full overflow-y-auto">
              <div className="h-[calc(100%+48px)]">
                <SupposedQuestionResult className="flex h-[calc((100%-48px)*4/5)] flex-col pb-3" />
                <SupposedQuestionModifyForm className="h-[calc((100%-48px)/5)]" />
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
