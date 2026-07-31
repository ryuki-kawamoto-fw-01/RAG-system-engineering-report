'use client';

import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import PageLayout from '@/app/_components/layout/page-layout';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { useAppSelector } from '@/app/_store/hooks';
import { cn } from '@/app/_utils/tw-merge';
import ErrorAnalysisFormArea from './_components/error-analysis-form-area';
import ErrorAnalysisResults from './_components/error-analysis-results';
import ErrorAnalysisTitle from './_components/error-analysis-title';

export default function Layout() {
  const { result } = useAppSelector((state) => state.errorAnalysis);
  const resultText = result.explanation + result.solutionAndExample;
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } =
    useUseCaseLayout(resultText);

  return (
    <PageLayout className="flex flex-col">
      <ErrorAnalysisTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex min-h-0 flex-1 gap-x-10 overflow-hidden">
        {/* エラー解析エリア */}
        {(isLeftOnly || isTwoColumns) && (
          <ErrorAnalysisFormArea
            switchLayout={switchLayout}
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px] min-h-0')}
          />
        )}
        {/* エラー解析結果エリア */}
        {(isRightOnly || isTwoColumns) && (
          <ErrorAnalysisResults className={cn('w-full', isTwoColumns && 'w-2/3 min-h-0')} />
        )}
      </div>
    </PageLayout>
  );
}
