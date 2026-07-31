'use client';

import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { useAppSelector } from '@/app/_store/hooks';
import { cn } from '@/app/_utils/tw-merge';
import PageLayout from '../../_components/layout/page-layout';
import TalkScriptForm from './_components/talk-script-form';
import TalkScriptResults from './_components/talk-script-results';
import TalkScriptTitle from './_components/talk-script-title';

export default function Layout() {
  const { result } = useAppSelector((state) => state.talkScript);
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(result);

  return (
    <PageLayout className="flex flex-col">
      <TalkScriptTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex min-h-0 flex-1 gap-x-10 overflow-hidden">
        {/* トークスクリプト設定エリア */}
        {(isLeftOnly || isTwoColumns) && (
          <TalkScriptForm
            switchLayout={switchLayout}
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px] min-h-0')}
          />
        )}
        {/* トークスクリプト作成結果エリア */}
        {(isRightOnly || isTwoColumns) && (
          <TalkScriptResults className={cn('w-full', isTwoColumns && 'w-2/3 min-h-0')} />
        )}
      </div>
    </PageLayout>
  );
}
