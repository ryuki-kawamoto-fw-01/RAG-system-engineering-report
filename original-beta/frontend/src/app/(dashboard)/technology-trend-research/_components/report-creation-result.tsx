import { cn } from '@/app/_utils/tw-merge';
import ReportCreationResultArea from './report-creation-result-area';

type Props = {
  className?: string;
};

export default function ReportCreationResult({ className }: Props) {
  return (
    <div className={cn('flex flex-col', className)}>
      <ReportCreationResultArea />
    </div>
  );
}
