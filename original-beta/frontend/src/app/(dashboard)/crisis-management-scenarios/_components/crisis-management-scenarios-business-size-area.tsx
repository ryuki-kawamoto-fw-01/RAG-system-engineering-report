import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setCrisisManagementScenarios } from '@/app/_store/slice/crisis-management-scenarios';
import { Textarea } from '../../../_components/ui/textarea';
import { CrisisManagementScenariosSchema } from '../_utils/schema';

export default function CrisisManagementScenariosBusinessSizeArea() {
  const { onChangeField, control } = useFormReduxContext<CrisisManagementScenariosSchema>({
    setRedux: setCrisisManagementScenarios,
  });
  return (
    <div>
      <FormField
        control={control}
        name="businessSize"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>企業規模・拠点情報</RequiredLabel>
            <Textarea
              {...field}
              id="businessSize"
              placeholder="例：中小企業、大企業、都市部、地方 など"
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({ businessSize: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
