import { useFormContext } from 'react-hook-form';
import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '../../../_components/ui/button';
import { KeyPointExtractionSchema } from '../_utils/schema';
import { SelectTab } from './key-point-extraction-area';

interface Props {
  selectedTab: SelectTab;
}

export default function SubmitButton({ selectedTab }: Props): JSX.Element {
  const {
    watch,
    formState: { isSubmitting },
  } = useFormContext<KeyPointExtractionSchema>();
  const { text, fileList } = watch();
  return (
    <Button
      type="submit"
      variant="secondary"
      disabled={
        selectedTab === 'file-upload'
          ? fileList.length === 0 || isSubmitting
          : text.trim() === '' || isSubmitting
      }
      className="absolute bottom-0 left-1/2 w-full max-w-[180px] -translate-x-1/2"
    >
      {isSubmitting ? (
        <>
          <Spinner className="mr-2 size-6 animate-spin" />
          <span>抽出中です</span>
        </>
      ) : (
        <span>抽出する</span>
      )}
    </Button>
  );
}
