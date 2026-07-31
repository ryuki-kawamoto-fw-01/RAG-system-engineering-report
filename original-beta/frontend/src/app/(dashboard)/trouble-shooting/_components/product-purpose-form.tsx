import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { add } from '@/app/_store/slice/trouble-shooting';
import { TroubleShootingSchema } from '../_utils/schema';

export default function ProductPurposeForm(): JSX.Element {
  const { onChangeField, control } = useFormReduxContext<TroubleShootingSchema>({
    setRedux: add,
  });
  return (
    <div>
      <FormField
        control={control}
        name="productPurpose"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>製品の目的</RequiredLabel>
            <Textarea
              {...field}
              id="productPurpose"
              placeholder="例：書類の印刷、コピー"
              className="min-h-[100px]"
              onKeyUp={(e) => {
                onChangeField({
                  productPurpose: (e.target as HTMLTextAreaElement).value,
                });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
