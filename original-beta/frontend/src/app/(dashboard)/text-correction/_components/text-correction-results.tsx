// 文章校正結果エリア
import { useAppSelector } from '@/app/_store/hooks';

import { cn } from '@/app/_utils/tw-merge';
import ComparisonArea from './comparison-area';
import PointsOfCriticismArea from './points-of-criticism-area';

type Props = {
  className?: string;
};

export default function TextCorrectionResults({ className }: Props) {
  const { pointsOfCriticism, originalText, correctedText } = useAppSelector(
    (state) => state.textCorrection
  );
  return (
    <div className={cn('flex flex-col h-full overflow-auto', className)}>
      {/* 指摘事項エリア */}
      <PointsOfCriticismArea pointsOfCriticism={pointsOfCriticism} />
      {/* 比較エリア */}
      <ComparisonArea
        originalText={originalText}
        correctedText={correctedText}
        className="mt-3 grow"
      />
    </div>
  );
}
