'use client';

import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { useAppSelector } from '@/app/_store/hooks';
import { cn } from '@/app/_utils/tw-merge';
import PageLayout from '../../_components/layout/page-layout';
import FormArea from './_components/form-area';
import NeedsSurveyTitle from './_components/needs-survey-title';
import Results from './_components/results';

export default function Layout() {
  const { result } = useAppSelector((state) => state.needsSurvey);
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(result);

  return (
    <PageLayout className="flex flex-col">
      <NeedsSurveyTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex min-h-0 flex-1 gap-x-10 overflow-hidden">
        {/* フォームエリア */}
        {(isLeftOnly || isTwoColumns) && (
          <FormArea
            switchLayout={switchLayout}
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px] min-h-0')}
          />
        )}
        {/* 作成結果エリア */}
        {(isRightOnly || isTwoColumns) && (
          <Results className={cn('w-full', isTwoColumns && 'w-2/3 min-h-0')} />
        )}
      </div>
    </PageLayout>
  );
}
