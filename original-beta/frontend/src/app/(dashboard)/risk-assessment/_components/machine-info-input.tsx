import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { add } from '@/app/_store/slice/risk-assessment';
import { RiskAssessmentSchema } from '../_utils/schema';

export default function MachineInfoInput() {
  const { onChangeField, control } = useFormReduxContext<RiskAssessmentSchema>({
    setRedux: add,
  });
  return (
    <div>
      <FormField
        control={control}
        name="machineInfo"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>使用機械の種類と特性</RequiredLabel>
            <Textarea
              {...field}
              id="machineInfo"
              placeholder="使用する機械の名称、機能、危険性などを入力"
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({ machineInfo: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
