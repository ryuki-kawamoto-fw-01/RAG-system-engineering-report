'use client';

import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { cn } from '@/app/_utils/tw-merge';
import PageLayout from '../../_components/layout/page-layout';
import { useAppSelector } from '../../_store/hooks';
import { selectDesignDocumentReview } from '../../_store/selectors/design-document-review';
import DesignDocumentReviewFormArea from './_components/design-document-review-form-area';
import DesignDocumentReviewResultArea from './_components/design-document-review-result-area';
import DesignDocumentReviewTitle from './_components/design-document-review-title';

export default function Layout() {
  const { result } = useAppSelector(selectDesignDocumentReview);
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(result);

  return (
    <PageLayout className="flex flex-col">
      <DesignDocumentReviewTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />
      <div className="flex min-h-0 flex-1 gap-x-10 overflow-hidden">
        {(isLeftOnly || isTwoColumns) && (
          <DesignDocumentReviewFormArea
            className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px] min-h-0')}
            switchLayout={switchLayout}
          />
        )}
        {(isRightOnly || isTwoColumns) && (
          <div className={cn('w-full flex flex-col relative', isTwoColumns && 'w-2/3 min-h-0')}>
            <div className="h-full overflow-y-auto">
              <div className="h-[calc(100%+48px)]">
                <div className="flex h-[calc((100%-48px)*4/5)] flex-col">
                  <DesignDocumentReviewResultArea />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
