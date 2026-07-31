import { FormControl, FormField, FormItem, FormMessage } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';

import { setTargetMarket } from '@/app/_store/slice/product-promotion-strategy';
import type { ProductPromotionStrategyRequest } from '../_store/types';

export default function TargetMarketForm() {
  const form = useFormReduxContext<ProductPromotionStrategyRequest>({
    setRedux: setTargetMarket,
  });

  return (
    <FormField
      control={form.control}
      name="targetMarket"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel className="text-sm font-medium">ターゲット市場</RequiredLabel>
          <FormControl>
            <Textarea
              placeholder="ターゲット顧客層を入力してください&#10;例：30-50代の健康意識の高いビジネスパーソン、フィットネス愛好者、年収500万円以上の中高所得層"
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
