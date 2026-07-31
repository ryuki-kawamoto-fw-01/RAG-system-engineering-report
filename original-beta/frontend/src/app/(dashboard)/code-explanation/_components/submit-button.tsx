import { useFormContext } from 'react-hook-form';
import { Button } from '@/app/_components/ui/button';
import { Spinner } from '@/app/_components/ui/spinner';
import { CodeExplanationSchema } from '../_utils/schema';

export default function SubmitButton(): JSX.Element {
  const {
    watch,
    formState: { isSubmitting },
  } = useFormContext<CodeExplanationSchema>();
  const formValues = watch();

  const isProgrammingLanguageValid = !!formValues.programmingLanguage?.trim();
  const isCodeValid = !!formValues.code?.trim();

  // すべての必須項目が有効かどうか
  const isAllRequiredValid = isProgrammingLanguageValid && isCodeValid;
  return (
    <Button
      type="submit"
      variant="secondary"
      disabled={!isAllRequiredValid || isSubmitting}
      className="absolute bottom-0 left-1/2 w-full max-w-[180px] -translate-x-1/2"
    >
      {isSubmitting ? (
        <>
          <Spinner className="mr-2 size-6 animate-spin" />
          解説を作成中
        </>
      ) : (
        <span>作成する</span>
      )}
    </Button>
  );
}
