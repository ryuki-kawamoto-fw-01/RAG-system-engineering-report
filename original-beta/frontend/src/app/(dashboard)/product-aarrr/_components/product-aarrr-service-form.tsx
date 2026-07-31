import { FormField, FormItem } from '@/app/_components/ui/form';
import { Input } from '@/app/_components/ui/input';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setProductAARRR } from '@/app/_store/slice/product-aarrr';
import { ProductAARRRSchema } from '../_utils/schema';

export default function ProductAARRRServiceForm() {
  const { onChangeField, control } = useFormReduxContext<ProductAARRRSchema>({
    setRedux: setProductAARRR,
  });

  return (
    <FormField
      control={control}
      name="product_service"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel>商品・サービス</RequiredLabel>
          <Input
            {...field}
            placeholder="例：スマートフォンアプリ「家計簿AI」"
            onBlur={(e) => {
              onChangeField({ product_service: e.target.value });
            }}
          />
        </FormItem>
      )}
    />
  );
}
