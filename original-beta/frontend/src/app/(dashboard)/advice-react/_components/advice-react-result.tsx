import { cn } from '@/app/_utils/tw-merge';
import AdviceReactResultArea from './advice-react-result-area';

type Props = {
  className?: string;
};

export default function AdviceReactResults({ className }: Props) {
  return (
    <div className={cn('flex h-full flex-col relative overflow-hidden', className)}>
      <div className="h-full overflow-y-auto overflow-x-hidden">
        <div className="h-[calc(100%+48px)]">
          {/* 作成結果エリア */}
          <AdviceReactResultArea className="flex h-full flex-col" />
        </div>
      </div>
    </div>
  );
}
