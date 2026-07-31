'use client';

import { useRef, useState } from 'react';
import PageLayout from '../../_components/layout/page-layout';
import ChatThread from './_components/chat';
import AdvisorTitle from './_components/problem-solving-advisor-title';

export default function Page() {
  const threadId = 'problem-solving-advisor';
  const resetFunctionRef = useRef<(() => void) | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // 送信状態を管理

  const handleResetCallback = (resetFunction: () => void) => {
    resetFunctionRef.current = resetFunction;
  };

  const handleReset = () => {
    if (resetFunctionRef.current && !isSubmitting) {
      resetFunctionRef.current();
    }
  };

  return (
    <PageLayout>
      <AdvisorTitle onReset={handleReset} />
      <ChatThread
        id={threadId}
        threadId={threadId}
        onResetCallback={handleResetCallback}
        onSubmittingChange={setIsSubmitting}
      />
    </PageLayout>
  );
}
