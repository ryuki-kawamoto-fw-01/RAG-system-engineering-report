import { useFormContext } from 'react-hook-form';
import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '../../../_components/ui/button';
import { QualityReportInput } from '../_utils/schema';

export default function QualityReportButton() {
  const {
    formState: { isValid, isSubmitting },
  } = useFormContext<QualityReportInput>();

  return (
    <Button
      type="submit"
      variant="secondary"
      className="absolute bottom-0 left-1/2 w-full max-w-[180px] -translate-x-1/2"
      disabled={!isValid || isSubmitting}
    >
      {isSubmitting && <Spinner className="mr-2 size-6 animate-spin" />}
      {isSubmitting ? 'レポート作成中' : 'レポート作成'}
    </Button>
  );
}
