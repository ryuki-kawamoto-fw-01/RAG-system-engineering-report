import { useFormContext } from 'react-hook-form';
import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '../../../_components/ui/button';
import { DesignDocumentReviewSchema } from '../_utils/schema';

export default function ActionButtons() {
  const {
    formState: { isValid, isSubmitting },
  } = useFormContext<DesignDocumentReviewSchema>();
  return (
    <Button
      type="submit"
      variant="secondary"
      disabled={!isValid || isSubmitting}
      className="absolute bottom-0 left-1/2 w-full max-w-[180px] -translate-x-1/2"
    >
      {isSubmitting ? (
        <>
          <Spinner className="mr-2 size-6 animate-spin" />
          <span>作成中です</span>
        </>
      ) : (
        <span>作成する</span>
      )}
    </Button>
  );
}
