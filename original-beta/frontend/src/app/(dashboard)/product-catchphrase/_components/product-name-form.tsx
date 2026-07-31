import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setProductCatchphrase } from '@/app/_store/slice/product-catchphrase';
import { Textarea } from '../../../_components/ui/textarea';
import { ProductCatchphraseTextSchema } from '../_utils/schema';

export default function ProductNameForm() {
  const { onChangeField, control } = useFormReduxContext<ProductCatchphraseTextSchema>({
    setRedux: setProductCatchphrase,
  });
  return (
    <div>
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>製品名</RequiredLabel>
            <Textarea
              {...field}
              id="name"
              placeholder="製品名を入力してください"
              className="min-h-[80px]"
              onKeyUp={(e) => {
                onChangeField({ name: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
