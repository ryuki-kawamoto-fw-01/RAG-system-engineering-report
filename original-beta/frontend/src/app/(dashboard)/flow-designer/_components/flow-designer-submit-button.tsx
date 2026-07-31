import { LoaderIcon } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { useSelector } from 'react-redux';

import { Button } from '@/app/_components/ui/button';
import type { RootState } from '@/app/_store/store';
import type { FlowDesignerSchema } from '../_utils/schema';

export default function FlowDesignerSubmitButton() {
  const form = useFormContext<FlowDesignerSchema>();
  const { isLoading } = useSelector((state: RootState) => state.flowDesigner);

  return (
    <Button
      type="submit"
      variant="secondary"
      className="absolute bottom-0 left-1/2 w-full max-w-[180px] -translate-x-1/2"
      disabled={isLoading || !form.formState.isValid}
    >
      {isLoading ? (
        <>
          <LoaderIcon className="mr-2 size-4 animate-spin" />
          生成中...
        </>
      ) : (
        '工程管理表を作成'
      )}
    </Button>
  );
}
