import { cn } from '@/app/_utils/tw-merge';
import NewProductProposalResultArea from './new-product-proposal-result-area';

type Props = {
  className?: string;
};

export default function NewProductProposalResult({ className }: Props) {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex grow flex-col">
        {/* 企画書作成結果エリアのみ表示 */}
        <NewProductProposalResultArea />
      </div>
    </div>
  );
}
