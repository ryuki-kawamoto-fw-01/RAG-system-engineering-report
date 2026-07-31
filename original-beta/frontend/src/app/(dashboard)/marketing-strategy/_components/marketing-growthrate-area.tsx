import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setMarketingStrategy } from '@/app/_store/slice/marketingstrategy';
import { Textarea } from '../../../_components/ui/textarea';
import { MarketingStrategySchema } from '../_utils/schema';

export default function MarketingGrowthRateArea() {
  const { onChangeField, control } = useFormReduxContext<MarketingStrategySchema>({
    setRedux: setMarketingStrategy,
  });
  return (
    <div>
      <FormField
        control={control}
        name="GrowthRate"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>成長率</RequiredLabel>
            <Textarea
              {...field}
              id="GrowthRate"
              placeholder={
                '直近や将来的な予測成長率を入力してください。\n例：横ばい傾向、今後3年は年1%から2%程度の微増予測／年平均成長率（CAGR）12%、今後5年間で2倍に拡大見込み'
              }
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({ GrowthRate: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
