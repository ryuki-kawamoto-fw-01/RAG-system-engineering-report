import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setCrisisManagementScenarios } from '@/app/_store/slice/crisis-management-scenarios';
import { Textarea } from '../../../_components/ui/textarea';
import { CrisisManagementScenariosSchema } from '../_utils/schema';

export default function CrisisManagementScenariosIndustryArea() {
  const { onChangeField, control } = useFormReduxContext<CrisisManagementScenariosSchema>({
    setRedux: setCrisisManagementScenarios,
  });
  return (
    <div>
      <FormField
        control={control}
        name="industry"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>業界・業種</RequiredLabel>
            <Textarea
              {...field}
              id="industry"
              placeholder="例：自動車部品製造、食品加工、半導体製造、医薬品製造 など"
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({ industry: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
