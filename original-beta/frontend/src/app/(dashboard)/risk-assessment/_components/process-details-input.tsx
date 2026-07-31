import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { add } from '@/app/_store/slice/risk-assessment';
import { RiskAssessmentSchema } from '../_utils/schema';

export default function ProcessDetailsInput() {
  const { onChangeField, control } = useFormReduxContext<RiskAssessmentSchema>({
    setRedux: add,
  });
  return (
    <div>
      <FormField
        control={control}
        name="processDetails"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>製造作業工程の詳細</RequiredLabel>
            <Textarea
              {...field}
              id="processDetails"
              placeholder="工程の流れ、使用する道具、作業時間などを入力"
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({
                  processDetails: (e.target as HTMLTextAreaElement).value,
                });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
