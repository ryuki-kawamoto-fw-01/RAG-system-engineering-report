import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setMarketingStrategy } from '@/app/_store/slice/marketingstrategy';
import { Textarea } from '../../../_components/ui/textarea';
import { MarketingStrategySchema } from '../_utils/schema';

export default function MarketingSizeArea() {
  const { onChangeField, control } = useFormReduxContext<MarketingStrategySchema>({
    setRedux: setMarketingStrategy,
  });
  return (
    <div>
      <FormField
        control={control}
        name="MarketSize"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>市場規模</RequiredLabel>
            <Textarea
              {...field}
              id="Size"
              placeholder={
                'ターゲット市場と市場規模を入力してください\n例：世界の電気自動車:約4,000万台（2030年予測）'
              }
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({ MarketSize: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
