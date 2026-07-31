import { useFormContext } from 'react-hook-form';
import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '../../../_components/ui/button';
import { CreateTechnologyProposalSchema } from '../_utils/schema';

export default function CreateTechnologyProposalButton() {
  const {
    formState: { isValid, isSubmitting },
  } = useFormContext<CreateTechnologyProposalSchema>();

  return (
    <Button
      type="submit"
      variant="secondary"
      className="absolute bottom-0 left-1/2 w-full max-w-[180px] -translate-x-1/2"
      disabled={!isValid || isSubmitting}
    >
      {isSubmitting && <Spinner className="mr-2 size-6 animate-spin" />}
      {isSubmitting ? '作成中です' : '作成する'}
    </Button>
  );
}
