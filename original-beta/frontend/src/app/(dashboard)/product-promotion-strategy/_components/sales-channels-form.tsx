import { FormControl, FormField, FormItem, FormMessage } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';

import { setSalesChannels } from '@/app/_store/slice/product-promotion-strategy';
import type { ProductPromotionStrategyRequest } from '../_store/types';

export default function SalesChannelsForm() {
  const form = useFormReduxContext<ProductPromotionStrategyRequest>({
    setRedux: setSalesChannels,
  });

  return (
    <FormField
      control={form.control}
      name="salesChannels"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel className="text-sm font-medium">販売チャネル</RequiredLabel>
          <FormControl>
            <Textarea
              placeholder="販売チャネルを入力してください&#10;例：公式オンラインストア、Amazon、家電量販店、スポーツ用品店、企業向け直販"
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
