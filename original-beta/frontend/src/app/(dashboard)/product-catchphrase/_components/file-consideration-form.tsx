import { FormField, FormItem } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setProductCatchphrase } from '@/app/_store/slice/product-catchphrase';
import { Textarea } from '../../../_components/ui/textarea';
import { ProductCatchphraseFileSchema } from '../_utils/schema';

export default function FileConsiderationForm() {
  const { onChangeField, control } = useFormReduxContext<ProductCatchphraseFileSchema>({
    setRedux: setProductCatchphrase,
  });
  return (
    <div>
      <FormField
        control={control}
        name="fileConsideration"
        render={({ field }) => (
          <FormItem>
            <OptionalLabel>考慮事項</OptionalLabel>
            <Textarea
              {...field}
              placeholder="例：専門用語を控える"
              onKeyUp={(e) => {
                onChangeField({ fileConsideration: (e.target as HTMLTextAreaElement).value });
              }}
              className="min-h-[100px]"
            />
          </FormItem>
        )}
      />
    </div>
  );
}
