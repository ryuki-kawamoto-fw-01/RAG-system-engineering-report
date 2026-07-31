'use client';

import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { useAppSelector } from '@/app/_store/hooks';
import { cn } from '@/app/_utils/tw-merge';
import PageLayout from '../../_components/layout/page-layout';
import IdeationFormArea from './_components/ideation-form-area';
import IdeationResults from './_components/ideation-results';
import JudgeIdeaTitle from './_components/judge-idea-title';

export default function Layout() {
  const { result } = useAppSelector((state) => state.judgeIdea);
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(result);

  return (
    <PageLayout className="flex flex-col">
      <JudgeIdeaTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex min-h-0 flex-1 gap-x-10 overflow-hidden">
        {/* 新製品のアイデアの詳細入力エリア */}
        {(isLeftOnly || isTwoColumns) && (
          <IdeationFormArea
            switchLayout={switchLayout}
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px] min-h-0')}
          />
        )}
        {/* 評価出し作成結果エリア */}
        {(isRightOnly || isTwoColumns) && (
          <IdeationResults className={cn('w-full', isTwoColumns && 'w-2/3 min-h-0')} />
        )}
      </div>
    </PageLayout>
  );
}
