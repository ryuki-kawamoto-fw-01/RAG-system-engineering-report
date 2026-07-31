import { FormField, FormItem } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setCrisisManagementScenarios } from '@/app/_store/slice/crisis-management-scenarios';
import { Textarea } from '../../../_components/ui/textarea';
import { CrisisManagementScenariosSchema } from '../_utils/schema';

export default function CrisisManagementScenariosConsiderationArea() {
  const { onChangeField, control } = useFormReduxContext<CrisisManagementScenariosSchema>({
    setRedux: setCrisisManagementScenarios,
  });
  return (
    <div>
      <FormField
        control={control}
        name="additionalConsiderations"
        render={({ field }) => (
          <FormItem>
            <OptionalLabel>考慮事項</OptionalLabel>
            <Textarea
              {...field}
              id="additionalConsiderations"
              placeholder="例：10パターンの想定ケースと予防策を出力 など"
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({
                  additionalConsiderations: (e.target as HTMLTextAreaElement).value,
                });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
