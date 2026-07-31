import { Spinner } from '@/app/_components/icon/decorative';
import { cn } from '@/app/_utils/tw-merge';
import { Button } from '../../../_components/ui/button';

type Props = {
  isLoading: boolean;
  isDisabled: boolean;
  className?: string;
};

export default function SubmitButton({ isLoading, isDisabled, className }: Props): JSX.Element {
  return (
    <Button
      type="submit"
      variant="secondary"
      className={cn('absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[180px]', className)}
      disabled={isDisabled}
      onClick={() => onclick}
    >
      {isLoading && <Spinner className="mr-2 size-6 animate-spin" />}
      {isLoading ? '調査中です' : '調査する'}
    </Button>
  );
}
