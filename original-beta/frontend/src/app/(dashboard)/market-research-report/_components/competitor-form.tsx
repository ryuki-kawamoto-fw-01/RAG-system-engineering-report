import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setMarketResearchReport } from '@/app/_store/slice/market-research-report';
import { Textarea } from '../../../_components/ui/textarea';
import { MarketResearchReportSchema } from '../_utils/schema';

export default function CompetitorForm() {
  const { onChangeField, control } = useFormReduxContext<MarketResearchReportSchema>({
    setRedux: setMarketResearchReport,
  });
  return (
    <div>
      <FormField
        control={control}
        name="competitor"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>競合企業</RequiredLabel>
            <Textarea
              {...field}
              placeholder="競合対象とする企業を入力してください"
              className="min-h-[80px]"
              onKeyUp={(e) => {
                onChangeField({ competitor: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
