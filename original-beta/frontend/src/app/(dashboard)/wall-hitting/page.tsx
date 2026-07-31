'use client';

import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { useAppSelector } from '@/app/_store/hooks';
import { cn } from '@/app/_utils/tw-merge';
import PageLayout from '../../_components/layout/page-layout';
import HittingChat from './_components/hitting-chat';
import HittingFormArea from './_components/hitting-form-area';
import WallHittingTitle from './_components/wall-hitting-title';

export default function Layout() {
  const { theme, idea } = useAppSelector((state) => state.wallHitting);
  // theme と idea が両方存在する場合に結果エリアを表示
  const shouldShowResult = theme && idea;
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(
    shouldShowResult ? 'dummy' : ''
  );

  return (
    <PageLayout className="flex flex-col">
      <WallHittingTitle />
      {/* プロンプト表示切り替えボタン */}
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex flex-1 gap-x-10 overflow-hidden">
        {/* フォーム入力エリア */}
        {(isLeftOnly || isTwoColumns) && (
          <HittingFormArea
            switchLayout={switchLayout}
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px]')}
          />
        )}
        {/* チャットエリア(theme と idea があれば表示) */}
        {(isRightOnly || isTwoColumns) && shouldShowResult && (
          <div className={cn('w-full', isTwoColumns && 'w-2/3', 'flex flex-col h-full')}>
            {/* LayoutSwitchButtonの下にチャットエリアを配置 */}
            <div className="min-h-0 flex-1">
              <HittingChat theme={theme} idea={idea} />
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
