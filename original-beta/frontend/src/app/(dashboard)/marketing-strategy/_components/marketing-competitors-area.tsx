import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setMarketingStrategy } from '@/app/_store/slice/marketingstrategy';
import { Textarea } from '../../../_components/ui/textarea';
import { MarketingStrategySchema } from '../_utils/schema';

export default function MarketingCompetitorsArea() {
  const { onChangeField, control } = useFormReduxContext<MarketingStrategySchema>({
    setRedux: setMarketingStrategy,
  });
  return (
    <div>
      <FormField
        control={control}
        name="Competitors"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>競合製品の特長や価格</RequiredLabel>
            <Textarea
              {...field}
              id="Competitors"
              placeholder={
                '競合製品の具体的な特徴や価格を入力してください。\n例：テスラ Model3：価格約500万円～、航空距離約600km、OTAアップデートによる常時進化、ブランド力・先進性が強み。'
              }
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({ Competitors: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
