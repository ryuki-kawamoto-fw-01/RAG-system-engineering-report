import { cn } from '@/app/_utils/tw-merge';
import TermExplanationArea from './term-explanation-area';
import TermSummaryArea from './term-summary-area';

type Props = {
  className?: string;
};

export default function termSummaryResult({ className }: Props) {
  return (
    <div className={cn('flex h-full flex-col relative', className)}>
      <div className="h-full space-y-3 pb-[52px]">
        {/* 要約結果エリア */}
        <TermSummaryArea />
        {/* 用語解説エリア */}
        <TermExplanationArea />
      </div>
    </div>
  );
}
