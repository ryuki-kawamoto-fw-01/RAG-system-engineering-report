'use client';

import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import PageLayout from '@/app/_components/layout/page-layout';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { useAppSelector } from '@/app/_store/hooks';
import { cn } from '@/app/_utils/tw-merge';
import CodeExplanationInputArea from './_components/code-explanation-input-area';
import CodeExplanationResultArea from './_components/code-explanation-result-area';
import CodeExplanationTitle from './_components/code-explanation-title';

export default function Page() {
  const selector = useAppSelector((state) => state.codeExplanation);
  const result = selector.result ? selector.result : '';

  // レイアウト管理（初期値は自動的にLAYOUT_LEFT_ONLYになる）
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(result);
  return (
    <PageLayout className="flex flex-col">
      <CodeExplanationTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex min-h-0 flex-1 gap-x-10 overflow-hidden">
        {/* 入力エリア - レイアウトに応じて表示/非表示 */}
        {(isLeftOnly || isTwoColumns) && (
          <CodeExplanationInputArea
            switchLayout={switchLayout}
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px] min-h-0')}
          />
        )}
        {/* 事業におけるKPI、KGIの創出　結果エリア - 結果がある場合のみ表示 */}
        {(isRightOnly || isTwoColumns) && (
          <CodeExplanationResultArea className="w-full pt-[11px]" />
        )}
      </div>
    </PageLayout>
  );
}
