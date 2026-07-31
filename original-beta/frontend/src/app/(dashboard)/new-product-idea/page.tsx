'use client';

import PageLayout from '@/app/_components/layout/page-layout';
import NewProductIdeaFormArea from './_components/new-product-idea-form-area';
import NewProductIdeaResultArea from './_components/new-product-idea-result-area';
import NewProductIdeaTitle from './_components/new-product-idea-title';

export default function Page() {
  return (
    <PageLayout className="flex flex-col">
      <NewProductIdeaTitle />
      <div className="mt-3 flex flex-1 gap-x-5 overflow-hidden">
        {/* アイデア出しエリア */}
        <NewProductIdeaFormArea />
        {/* アイデア出し結果エリア */}
        <NewProductIdeaResultArea />
      </div>
    </PageLayout>
  );
}
