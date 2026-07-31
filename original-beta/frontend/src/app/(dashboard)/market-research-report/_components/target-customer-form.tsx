import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setMarketResearchReport } from '@/app/_store/slice/market-research-report';
import { Textarea } from '../../../_components/ui/textarea';
import { MarketResearchReportSchema } from '../_utils/schema';

export default function TargetCustomerForm() {
  const { onChangeField, control } = useFormReduxContext<MarketResearchReportSchema>({
    setRedux: setMarketResearchReport,
  });

  return (
    <div>
      <FormField
        control={control}
        name="target"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>ターゲット顧客</RequiredLabel>
            <Textarea
              {...field}
              placeholder={`ターゲットにしたい顧客層を入力してください\n例：一般消費者、企業など`}
              className="min-h-[80px]"
              onKeyUp={(e) => {
                onChangeField({ target: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
