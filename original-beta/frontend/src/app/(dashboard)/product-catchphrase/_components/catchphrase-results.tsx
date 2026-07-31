import { cn } from '@/app/_utils/tw-merge';
import CatchphraseResultArea from './catchphrase-result-area';

type Props = {
  className?: string;
};

export default function CatchphraseResults({ className }: Props) {
  return (
    <div className={cn('h-full overflow-y-auto', className)}>
      <div className="h-[calc(100%+48px)]">
        {/* キャッチコピー作成結果エリア */}
        <CatchphraseResultArea className="flex h-[calc((100%-48px)*4/5)] flex-col pb-3" />
      </div>
    </div>
  );
}
