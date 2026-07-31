import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setProductCatchphrase } from '@/app/_store/slice/product-catchphrase';
import { Textarea } from '../../../_components/ui/textarea';
import { ProductCatchphraseTextSchema } from '../_utils/schema';

export default function ProductInformationForm() {
  const { onChangeField, control } = useFormReduxContext<ProductCatchphraseTextSchema>({
    setRedux: setProductCatchphrase,
  });
  return (
    <div>
      <FormField
        control={control}
        name="information"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>商品情報</RequiredLabel>
            <Textarea
              {...field}
              id="information"
              placeholder="商品の使用場面や特徴を入力してください"
              className="min-h-[100px]"
              onKeyUp={(e) => {
                onChangeField({ information: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
