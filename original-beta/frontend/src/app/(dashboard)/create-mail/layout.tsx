'use client';
import { useState } from 'react';
import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import SvgMail from '@/app/_components/icon/button/Mail';
import TextLink from '@/app/_components/ui/text-link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/_components/ui/tooltip';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { useAppSelector } from '@/app/_store/hooks';
import { cn } from '@/app/_utils/tw-merge';
import PageLayout from '../../_components/layout/page-layout';
import CreateMailForm from './_components/create-mail-form';
import CreateMailResults from './_components/create-mail-results';
import CreateMailTitle from './_components/create-mail-title';

export default function Layout() {
  // タブ
  const [activeTab, setActiveTab] = useState('new');
  const { createdContent, createdSubject } = useAppSelector((state) => state.createMail);
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } =
    useUseCaseLayout(createdContent);

  return (
    <PageLayout className="flex flex-col">
      <CreateMailTitle />
      <div className="flex items-center justify-between">
        <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
        {activeTab === 'new' && (isTwoColumns || isRightOnly) && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <TextLink
                  href={`mailto:?subject=${encodeURIComponent(createdSubject)}&body=${encodeURIComponent(createdContent)}`}
                >
                  <SvgMail className="size-4" />
                  メールでひらく
                </TextLink>
              </TooltipTrigger>

              <TooltipContent>
                MSGファイルが出力されない場合は、既定のメールアプリ(MAILTO)をOutlookに設定してください。
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="flex min-h-0 flex-1 gap-x-10 overflow-hidden">
        {/* メール作成設定エリア */}
        {(isLeftOnly || isTwoColumns) && (
          <CreateMailForm
            setActiveTab={setActiveTab}
            switchLayout={switchLayout}
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px] min-h-0')}
          />
        )}
        {/* メール作成結果エリア */}
        {(isRightOnly || isTwoColumns) && (
          <CreateMailResults
            activeTab={activeTab}
            className={cn('w-full', isTwoColumns && 'w-2/3 min-h-0')}
          />
        )}
      </div>
    </PageLayout>
  );
}
