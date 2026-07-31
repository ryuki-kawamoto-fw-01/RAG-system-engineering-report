'use client';
import { useState } from 'react';

import PageLayout from '@/app/_components/layout/page-layout';
import { useAppSelector } from '@/app/_store/hooks';
import { initialState } from '@/app/_store/slice/source-code-creation';
import { SourceCodeChat } from './_components/source-code-chat';
import SourceCodeCreationTitle from './_components/source-code-creation-title';
import { SourceCodeReport } from './_components/source-code-report';

export default function Page() {
  const { report } = useAppSelector((state) => state.sourceCodeCreation);

  const [isEditing, setIsEditing] = useState(false);
  const isReportEmpty = report === initialState.report;

  return (
    <PageLayout className="flex flex-col">
      <SourceCodeCreationTitle />
      <div className="mt-3 flex min-h-0 flex-1 gap-10 overflow-hidden">
        {/* 初期表示はチャットのみ*/}
        {/*編集中はレポートのみ表示 */}
        {isReportEmpty ? (
          <SourceCodeChat />
        ) : isEditing ? (
          <SourceCodeReport
            isEditing
            onCancel={() => setIsEditing(false)}
            onSave={() => setIsEditing(false)}
          />
        ) : (
          <>
            <SourceCodeChat />
            <SourceCodeReport onEdit={() => setIsEditing(true)} />
          </>
        )}
      </div>
    </PageLayout>
  );
}
