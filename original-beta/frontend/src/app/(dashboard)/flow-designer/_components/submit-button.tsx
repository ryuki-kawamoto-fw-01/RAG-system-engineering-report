import { useFormContext } from 'react-hook-form';

import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '@/app/_components/ui/button';

export default function FlowDesignerSubmitButton() {
  const {
    formState: { isSubmitting },
  } = useFormContext();

  return (
    <div className="absolute inset-x-0 bottom-0 bg-white p-3">
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Spinner className="mr-2 size-4" />}
        工程管理表を作成
      </Button>
    </div>
  );
}
