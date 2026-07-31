import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setProductCatchphrase } from '@/app/_store/slice/product-catchphrase';
import { Textarea } from '../../../_components/ui/textarea';
import { ProductCatchphraseTextSchema } from '../_utils/schema';

export default function TargetCustomerForm() {
  const { onChangeField, control } = useFormReduxContext<ProductCatchphraseTextSchema>({
    setRedux: setProductCatchphrase,
  });
  return (
    <div>
      <FormField
        control={control}
        name="target"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>ターゲット顧客</RequiredLabel>
            <Textarea
              {...field}
              id="target"
              placeholder={`ターゲットにしたい顧客層を入力してください\n例：30代男性など`}
              className="min-h-[100px]"
              onKeyUp={(e) => {
                onChangeField({ target: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
