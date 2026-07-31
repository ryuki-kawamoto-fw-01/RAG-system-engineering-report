import { FormControl, FormField, FormItem, FormMessage } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';

import { setDifferentiationPoint } from '@/app/_store/slice/product-promotion-strategy';
import type { ProductPromotionStrategyRequest } from '../_store/types';

export default function DifferentiationPointForm() {
  const form = useFormReduxContext<ProductPromotionStrategyRequest>({
    setRedux: setDifferentiationPoint,
  });

  return (
    <FormField
      control={form.control}
      name="differentiationPoint"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel className="text-sm font-medium">差別化ポイント</RequiredLabel>
          <FormControl>
            <Textarea
              placeholder="競合他社との差別化ポイントを入力してください&#10;例：医療グレードのセンサー精度、7日間のバッテリー持続、AI による個別化されたヘルスアドバイス、企業の健康経営支援機能"
              className="min-h-[120px] resize-none"
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
