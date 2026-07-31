import { LoaderIcon } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { useSelector } from 'react-redux';

import { Button } from '@/app/_components/ui/button';
import type { RootState } from '@/app/_store/store';
import type { ProductPromotionStrategyRequest } from '../_store/types';

export default function SubmitButton() {
  const form = useFormContext<ProductPromotionStrategyRequest>();
  const { isLoading } = useSelector((state: RootState) => state.productPromotionStrategy);

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
        '拡販戦略を生成'
      )}
    </Button>
  );
}
