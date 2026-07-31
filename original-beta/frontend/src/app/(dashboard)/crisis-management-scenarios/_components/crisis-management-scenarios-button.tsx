import { useFormContext } from 'react-hook-form';
import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '../../../_components/ui/button';
import { CrisisManagementScenariosSchema } from '../_utils/schema';

export default function CrisisManagementScenariosButton() {
  const {
    formState: { isValid, isSubmitting },
  } = useFormContext<CrisisManagementScenariosSchema>();

  return (
    <div className="sticky bottom-[-10px] z-10 flex justify-center py-4">
      <Button
        type="submit"
        variant="secondary"
        className="w-full max-w-[180px]"
        disabled={!isValid || isSubmitting}
      >
        {isSubmitting && <Spinner className="mr-2 size-6 animate-spin" />}
        {isSubmitting ? '作成中です' : '作成する'}
      </Button>
    </div>
  );
}
