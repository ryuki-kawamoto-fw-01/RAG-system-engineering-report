import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setMarketingStrategy } from '@/app/_store/slice/marketingstrategy';
import { Textarea } from '../../../_components/ui/textarea';
import { MarketingStrategySchema } from '../_utils/schema';

export default function MarketingPurchasingBehaviorArea() {
  const { onChangeField, control } = useFormReduxContext<MarketingStrategySchema>({
    setRedux: setMarketingStrategy,
  });
  return (
    <div>
      <FormField
        control={control}
        name="PurchasingBehavior"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>購買行動や嗜好</RequiredLabel>
            <Textarea
              {...field}
              id="PurchasingBehavior"
              placeholder={
                '顧客の購買行動や嗜好を入力してください。\n例：ディーラー訪問よりも、公式サイトや比較サイトを通じた情報収集を中心、市場体験を重視する傾向が強い。航空距離充電のインフラの利便性を最重要視。'
              }
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({ PurchasingBehavior: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
