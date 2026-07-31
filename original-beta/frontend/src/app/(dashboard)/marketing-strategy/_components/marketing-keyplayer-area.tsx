import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setMarketingStrategy } from '@/app/_store/slice/marketingstrategy';
import { Textarea } from '../../../_components/ui/textarea';
import { MarketingStrategySchema } from '../_utils/schema';

export default function MarketingKeyPlayerArea() {
  const { onChangeField, control } = useFormReduxContext<MarketingStrategySchema>({
    setRedux: setMarketingStrategy,
  });
  return (
    <div>
      <FormField
        control={control}
        name="KeyPlayer"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>主要プレイヤー</RequiredLabel>
            <Textarea
              {...field}
              id="KeyPlayer"
              placeholder={
                '主要プレイヤーについての情報を入力してください。\n例:トヨタ、テスラ、BYD'
              }
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({ KeyPlayer: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
