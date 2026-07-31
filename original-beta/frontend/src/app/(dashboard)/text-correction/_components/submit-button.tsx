import { useFormContext } from 'react-hook-form';
import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '../../../_components/ui/button';
import { TextCorrectionSchema } from '../_utils/schema';
import { SelectTab } from './text-input-area';

interface Props {
  selectedTab: SelectTab;
}

export default function SubmitButton({ selectedTab }: Props): JSX.Element {
  const {
    watch,
    formState: { isSubmitting },
  } = useFormContext<TextCorrectionSchema>();
  const values = watch();
  const { documentType, checkpoints } = values;
  const text = 'text' in values ? values.text : '';
  const fileList = 'fileList' in values ? values.fileList : undefined;

  return (
    <Button
      type="submit"
      variant="secondary"
      disabled={
        selectedTab === 'file-upload'
          ? !fileList ||
            fileList.length === 0 ||
            !documentType ||
            checkpoints.length === 0 ||
            isSubmitting
          : text.trim() === '' || !documentType || checkpoints.length === 0 || isSubmitting
      }
      className="absolute bottom-0 left-1/2 w-full max-w-[180px] -translate-x-1/2"
    >
      {isSubmitting ? (
        <>
          <Spinner className="mr-2 size-6 animate-spin" />
          <span>校正中です</span>
        </>
      ) : (
        <span>校正する</span>
      )}
    </Button>
  );
}
