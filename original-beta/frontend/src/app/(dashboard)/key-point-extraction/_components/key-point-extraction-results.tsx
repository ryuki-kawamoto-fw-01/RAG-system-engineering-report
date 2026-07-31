// 要点抽出結果エリア
import { useAppSelector } from '@/app/_store/hooks';

import { cn } from '@/app/_utils/tw-merge';
import KeyPointExtractionResultArea from './key-point-extraction-resultarea';

type Props = {
  className?: string;
};

export default function KeyPointExtractionResults({ className }: Props) {
  const { keyPointExtractionResult } = useAppSelector((state) => state.keyPointExtraction);
  return (
    <div className={cn('flex flex-col h-full overflow-auto', className)}>
      {/* 結果エリア */}
      <KeyPointExtractionResultArea
        keyPointExtractionResult={keyPointExtractionResult}
        className="flex h-full flex-col pb-3"
      />
    </div>
  );
}
