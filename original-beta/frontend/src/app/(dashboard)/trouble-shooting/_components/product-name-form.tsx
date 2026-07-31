import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { add } from '@/app/_store/slice/trouble-shooting';
import { TroubleShootingSchema } from '../_utils/schema';

export default function ProductNameForm(): JSX.Element {
  const { onChangeField, control } = useFormReduxContext<TroubleShootingSchema>({
    setRedux: add,
  });
  return (
    <div>
      <FormField
        control={control}
        name="productName"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>製品名・システム名</RequiredLabel>
            <Textarea
              {...field}
              id="productName"
              placeholder="例：プリンターA100"
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({
                  productName: (e.target as HTMLTextAreaElement).value,
                });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
