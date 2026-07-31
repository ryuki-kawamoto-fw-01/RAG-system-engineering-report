'use client';

import { useAppSelector } from '@/app/_store/hooks';
import { cn } from '@/app/_utils/tw-merge';
import ResultDisplay from './result-display';

type Props = {
  className?: string;
};

export default function ProductAARRRResults({ className }: Props) {
  const { result } = useAppSelector((state) => state.productAARRR);

  return (
    <div className={cn('h-full', className)}>
      {result && <ResultDisplay className="flex size-full flex-col" />}
    </div>
  );
}
