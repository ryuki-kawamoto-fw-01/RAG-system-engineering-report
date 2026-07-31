import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { add } from '@/app/_store/slice/risk-assessment';
import { RiskAssessmentSchema } from '../_utils/schema';

export default function CurrentMeasuresInput() {
  const { onChangeField, control } = useFormReduxContext<RiskAssessmentSchema>({
    setRedux: add,
  });
  return (
    <div>
      <FormField
        control={control}
        name="currentMeasures"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>現状の対策内容</RequiredLabel>
            <Textarea
              {...field}
              id="currentMeasures"
              placeholder="現在実施している安全対策やルールを入力"
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({
                  currentMeasures: (e.target as HTMLTextAreaElement).value,
                });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
