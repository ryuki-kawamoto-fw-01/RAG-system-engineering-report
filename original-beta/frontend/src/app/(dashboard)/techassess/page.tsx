'use client';

import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import PageLayout from '@/app/_components/layout/page-layout';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { useAppSelector } from '@/app/_store/hooks';
import { selectTechassess } from '@/app/_store/selectors/techassess';
import { cn } from '@/app/_utils/tw-merge';
import TechassessInputForm from './_components/techassess_input_form';
import TechassessResultDisplay from './_components/techassess_result_form';
import TechassessTitle from './_components/techassess_title';

export default function TechassessPage() {
  const { techassessResult } = useAppSelector(selectTechassess) ?? {};
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(
    techassessResult || ''
  );

  return (
    <PageLayout className="flex flex-col">
      <TechassessTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex flex-1 gap-x-10 overflow-hidden">
        {/* フォームエリア */}
        {(isLeftOnly || isTwoColumns) && (
          <TechassessInputForm
            switchLayout={switchLayout}
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px]')}
          />
        )}
        {/* 結果表示エリア */}
        {(isRightOnly || isTwoColumns) && (
          <TechassessResultDisplay className={cn('w-full', isTwoColumns && 'w-2/3')} />
        )}
      </div>
    </PageLayout>
  );
}
