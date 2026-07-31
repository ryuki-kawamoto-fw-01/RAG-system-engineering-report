import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setMarketingStrategy } from '@/app/_store/slice/marketingstrategy';
import { Textarea } from '../../../_components/ui/textarea';
import { MarketingStrategySchema } from '../_utils/schema';

export default function MarketingCustomerAttributesArea() {
  const { onChangeField, control } = useFormReduxContext<MarketingStrategySchema>({
    setRedux: setMarketingStrategy,
  });
  return (
    <div>
      <FormField
        control={control}
        name="CustomerAttributes"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>顧客属性</RequiredLabel>
            <Textarea
              {...field}
              id="CustomerAttributes"
              placeholder={
                '年代や所得などの顧客属性を入力してください。\n例：年齢層：30代～50代中心、比較的高所得層（世帯年収700万円以上）居住地：都市部や海外在住者。自宅に駐車場（充電設備導入可能）を持つケースが多い。'
              }
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({ CustomerAttributes: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
