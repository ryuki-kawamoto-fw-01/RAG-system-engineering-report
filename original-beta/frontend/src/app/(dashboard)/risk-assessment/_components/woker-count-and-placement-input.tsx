import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { add } from '@/app/_store/slice/risk-assessment';
import { RiskAssessmentSchema } from '../_utils/schema';

export default function WorkerCountAndPlacementInput() {
  const { onChangeField, control } = useFormReduxContext<RiskAssessmentSchema>({
    setRedux: add,
  });
  return (
    <div>
      <FormField
        control={control}
        name="workerCountAndPlacement"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>作業者数と配置</RequiredLabel>
            <Textarea
              {...field}
              id="workerCountAndPlacement"
              placeholder="作業員の人数、役割、配置場所を入力"
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({
                  workerCountAndPlacement: (e.target as HTMLTextAreaElement).value,
                });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
