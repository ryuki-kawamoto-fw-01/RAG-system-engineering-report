import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { add } from '@/app/_store/slice/risk-assessment';
import { RiskAssessmentSchema } from '../_utils/schema';

export default function WorkerInfoInput() {
  const { onChangeField, control } = useFormReduxContext<RiskAssessmentSchema>({
    setRedux: add,
  });
  return (
    <div>
      <FormField
        control={control}
        name="workerInfo"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>労働者情報</RequiredLabel>
            <Textarea
              {...field}
              id="workerInfo"
              placeholder="年齢層、経験年数、資格の有無などを入力"
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({ workerInfo: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
