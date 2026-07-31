import { FormControl, FormField, FormItem, FormMessage } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';

import { setPromotionTools } from '@/app/_store/slice/product-promotion-strategy';
import type { ProductPromotionStrategyRequest } from '../_store/types';

export default function PromotionToolsForm() {
  const form = useFormReduxContext<ProductPromotionStrategyRequest>({
    setRedux: setPromotionTools,
  });

  return (
    <FormField
      control={form.control}
      name="promotionTools"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel className="text-sm font-medium">販促ツール</RequiredLabel>
          <FormControl>
            <Textarea
              placeholder="使用する販促ツールや手法を入力してください&#10;例：インフルエンサーマーケティング、健康関連のWebメディア広告、フィットネスジムでの体験イベント、SNS広告"
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
