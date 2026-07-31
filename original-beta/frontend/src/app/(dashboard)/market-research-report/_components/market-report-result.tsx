import { cn } from '@/app/_utils/tw-merge';
import MarketReportResultArea from './market-report-result-area';

type Props = {
  className?: string;
};

export default function MarketReportResult({ className }: Props) {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex grow flex-col">
        {/* アイデア作成結果エリアのみ表示 */}
        <MarketReportResultArea />
      </div>
    </div>
  );
}
