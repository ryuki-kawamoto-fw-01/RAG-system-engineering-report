'use client';

import { cn } from '@/app/_utils/tw-merge';
import ErrorAnalysisResultArea from './error-analysis-result-area';

type Props = {
  className?: string;
};

export default function ErrorAnalysisResults({ className }: Props) {
  return (
    <div className={cn('relative flex h-full flex-col overflow-hidden', className)}>
      <ErrorAnalysisResultArea className="flex h-full flex-col" />
    </div>
  );
}
