import { FormField, FormItem } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setProductAARRR } from '@/app/_store/slice/product-aarrr';
import { ProductAARRRSchema } from '../_utils/schema';

export default function ProductAARRRConsiderationsForm() {
  const { onChangeField, control } = useFormReduxContext<ProductAARRRSchema>({
    setRedux: setProductAARRR,
  });

  return (
    <FormField
      control={control}
      name="additionalConsiderations"
      render={({ field }) => (
        <FormItem>
          <OptionalLabel>追加考慮事項</OptionalLabel>
          <Textarea
            {...field}
            placeholder="例：具体的で実行可能な施策を重視して分析してください"
            className="min-h-[150px]"
            onBlur={(e) => {
              onChangeField({
                additionalConsiderations: e.target.value,
              });
            }}
          />
        </FormItem>
      )}
    />
  );
}
