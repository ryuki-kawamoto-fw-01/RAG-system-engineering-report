import { cn } from '@/app/_utils/tw-merge';
import TextCheckResultArea from './text-check-result-area';

type Props = {
  className?: string;
};

export default function TextCheckResults({ className }: Props) {
  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* 文章の指摘ポイント結果エリア */}
      <TextCheckResultArea />
    </div>
  );
}
