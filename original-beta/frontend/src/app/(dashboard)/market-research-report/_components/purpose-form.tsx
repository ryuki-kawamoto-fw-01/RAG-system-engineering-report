import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setMarketResearchReport } from '@/app/_store/slice/market-research-report';
import { Textarea } from '../../../_components/ui/textarea';
import { MarketResearchReportSchema } from '../_utils/schema';

export default function PurposeForm() {
  const { onChangeField, control } = useFormReduxContext<MarketResearchReportSchema>({
    setRedux: setMarketResearchReport,
  });
  return (
    <div>
      <FormField
        control={control}
        name="purpose"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>調査の背景・目的</RequiredLabel>
            <Textarea
              {...field}
              placeholder={`調査する目的を入力してください\n例：生成AIの活用を拡大したい`}
              className="min-h-[100px]"
              onKeyUp={(e) => {
                onChangeField({ purpose: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
