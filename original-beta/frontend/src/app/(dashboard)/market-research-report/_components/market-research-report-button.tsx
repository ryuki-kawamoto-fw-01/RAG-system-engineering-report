import { useFormContext } from 'react-hook-form';
import Spinner from '@/app/_components/icon/decorative/Spinner';
import { Button } from '../../../_components/ui/button';
import { MarketResearchReportSchema } from '../_utils/schema';

type Props = {
  label?: string;
  onClick?: () => void;
  type?: 'submit' | 'button';
  disabled?: boolean;
  isLoading?: boolean;
};

export default function MarketResearchReportButton({
  label = '作成する',
  onClick,
  type = 'submit',
  disabled,
  isLoading = false,
}: Props) {
  const {
    formState: { isValid, isSubmitting },
  } = useFormContext<MarketResearchReportSchema>();

  const loading = isLoading || isSubmitting;

  return (
    <Button
      type={type}
      variant="secondary"
      className="absolute bottom-0 left-1/2 w-full max-w-[180px] -translate-x-1/2"
      disabled={disabled ?? (!isValid || loading)}
      onClick={onClick}
    >
      {loading && <Spinner className="mr-2 size-6 animate-spin" />}
      {loading ? (label === '作成する' ? '作成中です' : '修正中です') : label}
    </Button>
  );
}
