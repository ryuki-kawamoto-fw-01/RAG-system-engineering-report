import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { add } from '@/app/_store/slice/sales-forecast';
import { Textarea } from '../../../_components/ui/textarea';
import { SalesForecastSchema } from '../_utils/schema';

export default function CompetingInformationFields() {
  const { onChangeField, control } = useFormReduxContext<SalesForecastSchema>({
    setRedux: add,
  });
  return (
    <div>
      {/* 見出し */}
      <h2 className="mb-4 text-lg font-bold">市場データと競合情報</h2>
      {/* 既に収集している市場データ */}
      <FormField
        control={control}
        name="marketData"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>既に収集している市場データ</RequiredLabel>
            <Textarea
              {...field}
              id="marketData"
              placeholder="例：国内の従業員50〜500名規模の企業数、PoC効果：返信率+25％"
              className="min-h-[38px] resize-y"
              onKeyUp={(e) => {
                onChangeField({ marketData: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />

      {/* 主要競合製品と特徴 */}
      <FormField
        control={control}
        name="competingProducts"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>主要競合製品と特徴</RequiredLabel>
            <Textarea
              {...field}
              id="competingProducts"
              placeholder="例：競合A：月額80,000円（税抜想定）／高機能帯、競合B：月額49,000円（税抜想定）／機能限定版"
              className="min-h-[38px] resize-y"
              onKeyUp={(e) => {
                onChangeField({ competingProducts: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
