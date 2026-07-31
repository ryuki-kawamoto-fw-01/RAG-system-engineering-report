import { useFormContext } from 'react-hook-form';
import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '@/app/_components/ui/button';
import { DefectAnalysisReportSchema } from '../_utils/schema';

export default function DefectAnalysisReportSubmitButton() {
  const {
    formState: { isValid, isSubmitting },
  } = useFormContext<DefectAnalysisReportSchema>();
  return (
    <Button
      type="submit"
      variant="secondary"
      className="absolute bottom-0 left-1/2 w-full max-w-[180px] -translate-x-1/2"
      disabled={!isValid || isSubmitting}
    >
      {isSubmitting ? (
        <>
          <Spinner className="mr-2 size-6 animate-spin" />
          分析中です
        </>
      ) : (
        '分析する'
      )}
    </Button>
  );
}
