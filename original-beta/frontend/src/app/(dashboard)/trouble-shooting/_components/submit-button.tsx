import { useFormContext } from 'react-hook-form';
import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '../../../_components/ui/button';
import { TroubleShootingSchema } from '../_utils/schema';
import { SelectTab } from './product-specification-form';

interface Props {
  selectedTab: SelectTab;
}

export default function SubmitButton({ selectedTab }: Props): JSX.Element {
  const {
    watch,
    formState: { isSubmitting },
  } = useFormContext<TroubleShootingSchema>();
  const { productSpecificationText, productSpecificationFiles, productName, productPurpose } =
    watch();
  return (
    <Button
      type="submit"
      variant="secondary"
      disabled={
        selectedTab === 'file-upload'
          ? productSpecificationFiles.length === 0 ||
            !productName ||
            !productPurpose ||
            isSubmitting
          : productSpecificationText.trim() === '' ||
            !productName ||
            !productPurpose ||
            isSubmitting
      }
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
