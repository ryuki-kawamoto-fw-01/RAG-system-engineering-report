import { FormField, FormItem } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setCrisisManagementScenarios } from '@/app/_store/slice/crisis-management-scenarios'; //修正を実施
import { Textarea } from '../../../_components/ui/textarea';
import { CrisisManagementScenariosSchema } from '../_utils/schema'; //修正を実施

export default function CrisisManagementScenariosAdditionalContentsArea() {
  const { onChangeField, control } = useFormReduxContext<CrisisManagementScenariosSchema>({
    setRedux: setCrisisManagementScenarios,
  });
  return (
    <div>
      <FormField
        control={control}
        name="additionalContents"
        render={({ field }) => (
          <FormItem>
            <OptionalLabel>リスク内容</OptionalLabel>
            <Textarea
              {...field}
              id="additionalContents"
              placeholder="例：熟練技術者の高齢化と若手不足により、業務継続が困難になる可能性"
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({
                  additionalContents: (e.target as HTMLTextAreaElement).value,
                });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
