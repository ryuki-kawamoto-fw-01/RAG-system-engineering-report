import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setProductCatchphrase } from '@/app/_store/slice/product-catchphrase';
import { Textarea } from '../../../_components/ui/textarea';
import { ProductCatchphraseTextSchema } from '../_utils/schema';

export default function CompetitorForm() {
  const { onChangeField, control } = useFormReduxContext<ProductCatchphraseTextSchema>({
    setRedux: setProductCatchphrase,
  });
  return (
    <div>
      <FormField
        control={control}
        name="competitor"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>競合との比較</RequiredLabel>
            <Textarea
              {...field}
              id="competitor"
              placeholder={`競合と比較した製品のポイントを入力してください\n例：価格が安いなど`}
              className="min-h-[100px]"
              onKeyUp={(e) => {
                onChangeField({ competitor: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
