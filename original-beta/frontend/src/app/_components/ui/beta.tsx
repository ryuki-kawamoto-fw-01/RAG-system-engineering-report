import { cn } from '@/app/_utils/tw-merge';
import SvgBeta from '../icon/sidebar/Β';

type Props = {
  className?: string;
};

export default function Beta({ className }: Props) {
  return (
    <div
      className={cn(
        'border-slate-500 border size-[15px] flex justify-center items-center rounded',
        className
      )}
    >
      <SvgBeta className="h-2.5 w-[5px]" />
    </div>
  );
}
