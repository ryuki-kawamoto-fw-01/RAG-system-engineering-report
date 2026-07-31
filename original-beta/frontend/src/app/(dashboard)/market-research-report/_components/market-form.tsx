import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setMarketResearchReport } from '@/app/_store/slice/market-research-report';
import { Textarea } from '../../../_components/ui/textarea';
import { MarketResearchReportSchema } from '../_utils/schema';

export default function MarketForm() {
  const { onChangeField, control } = useFormReduxContext<MarketResearchReportSchema>({
    setRedux: setMarketResearchReport,
  });
  return (
    <div>
      <FormField
        control={control}
        name="market"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>調査する市場・分野</RequiredLabel>
            <Textarea
              {...field}
              placeholder={`調査の対象とする市場・分野を入力してください\n例：製造業、画像分析など`}
              className="min-h-[80px]"
              onKeyUp={(e) => {
                onChangeField({ market: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
