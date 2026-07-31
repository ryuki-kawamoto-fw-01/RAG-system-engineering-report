import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '@/app/_components/ui/button';
import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setNewProductNameRequest } from '@/app/_store/slice/create-product-name';
import { CreateNewProductNameSchema } from '../_utils/schema';

type Props = {
  className?: string;
};

export default function NewProductNameRequestForm({ className }: Props) {
  const {
    control,
    onChangeField,
    formState: { isSubmitting, isValid },
  } = useFormReduxContext<CreateNewProductNameSchema>({
    setRedux: setNewProductNameRequest,
  });

  return (
    <div className={className}>
      <FormField
        control={control}
        name="newProductNameRequest"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>結果を調整する</RequiredLabel>
            <Textarea
              {...field}
              onBlur={(e) => {
                onChangeField(e.target.value);
              }}
              placeholder={
                'ネーミング案を修正するための指示を入力してください\n例：20文字以内で作成する'
              }
              className="min-h-[100px] resize-none"
            />
          </FormItem>
        )}
      />
      <Button
        type="submit"
        variant="secondary"
        disabled={!isValid || isSubmitting}
        className="absolute bottom-0 left-1/2 w-full max-w-[180px] -translate-x-1/2"
      >
        {isSubmitting ? (
          <>
            <Spinner className="mr-2 size-6 animate-spin" />
            再作成中です
          </>
        ) : (
          '再作成する'
        )}
      </Button>
    </div>
  );
}
