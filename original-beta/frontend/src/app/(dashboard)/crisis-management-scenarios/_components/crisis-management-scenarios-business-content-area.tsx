import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setCrisisManagementScenarios } from '@/app/_store/slice/crisis-management-scenarios';
import { Textarea } from '../../../_components/ui/textarea';
import { CrisisManagementScenariosSchema } from '../_utils/schema';

export default function CrisisManagementScenariosBusinessContentArea() {
  const { onChangeField, control } = useFormReduxContext<CrisisManagementScenariosSchema>({
    setRedux: setCrisisManagementScenarios,
  });
  return (
    <div>
      <FormField
        control={control}
        name="businessContent"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>シナリオを作成する業務内容</RequiredLabel>
            <Textarea
              {...field}
              id="businessContent"
              placeholder="例：製造ラインの設備保守業務、製品の出荷、原材料の調達、物流管理 など"
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({ businessContent: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
