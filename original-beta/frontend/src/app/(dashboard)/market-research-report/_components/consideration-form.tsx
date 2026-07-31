import { FormField, FormItem } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setMarketResearchReport } from '@/app/_store/slice/market-research-report';
import { Textarea } from '../../../_components/ui/textarea';
import { MarketResearchReportSchema } from '../_utils/schema';

export default function ConsiderationForm() {
  const { onChangeField, control } = useFormReduxContext<MarketResearchReportSchema>({
    setRedux: setMarketResearchReport,
  });
  return (
    <div>
      <FormField
        control={control}
        name="consideration"
        render={({ field }) => (
          <FormItem>
            <OptionalLabel>考慮事項</OptionalLabel>
            <Textarea
              {...field}
              placeholder="例：分析方法、図やグラフの指定など"
              onKeyUp={(e) => {
                onChangeField({ consideration: (e.target as HTMLTextAreaElement).value });
              }}
              className="min-h-[100px]"
            />
          </FormItem>
        )}
      />
    </div>
  );
}
