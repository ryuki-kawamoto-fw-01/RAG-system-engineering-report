// 実行ボタンエリア
import { useFormContext } from 'react-hook-form';
import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '../../../_components/ui/button';

export function ButtonArea() {
  const {
    formState: { isValid, isSubmitting },
  } = useFormContext();

  return (
    <Button
      type="submit"
      variant="secondary"
      disabled={!isValid || isSubmitting}
      className="sticky bottom-0 mx-auto w-full max-w-[180px]"
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
