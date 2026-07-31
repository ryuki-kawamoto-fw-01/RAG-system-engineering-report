import { useFormContext } from 'react-hook-form';
import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '../../../_components/ui/button';

type Props = {
  selectedTab: 'form-input' | 'file-upload';
};

export default function ProductCatchphraseButton({ selectedTab }: Props) {
  const {
    watch,
    formState: { isSubmitting },
  } = useFormContext();
  const { name, information, target, competitor, fileList } = watch();

  const isDisabled =
    selectedTab === 'file-upload'
      ? !fileList || fileList.length === 0 || isSubmitting
      : !name || !information || !target || !competitor || isSubmitting;

  return (
    <Button
      type="submit"
      variant="secondary"
      className="absolute bottom-0 left-1/2 w-full max-w-[180px] -translate-x-1/2"
      disabled={isDisabled}
    >
      {isSubmitting && <Spinner className="mr-2 size-6 animate-spin" />}
      {isSubmitting ? '作成中です' : '作成する'}
    </Button>
  );
}
