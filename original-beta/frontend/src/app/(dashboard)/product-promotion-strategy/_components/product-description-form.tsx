import { FormControl, FormField, FormItem, FormMessage } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';

import { setProductDescription } from '@/app/_store/slice/product-promotion-strategy';
import type { ProductPromotionStrategyRequest } from '../_store/types';

export default function ProductDescriptionForm() {
  const form = useFormReduxContext<ProductPromotionStrategyRequest>({
    setRedux: setProductDescription,
  });

  return (
    <FormField
      control={form.control}
      name="productDescription"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel className="text-sm font-medium">商品・サービスの概要</RequiredLabel>
          <FormControl>
            <Textarea
              placeholder="商品・サービスの概要を入力してください"
              className="min-h-[80px] resize-none"
              {...field}
              onChange={(e) => {
                field.onChange(e);
                form.onChangeField(e.target.value);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
