import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { add } from '@/app/_store/slice/advice-consulting';
import { AdviceConsultingSchema } from '../_utils/schema';

export default function RoleForm() {
  const { onChangeField, control } = useFormReduxContext<AdviceConsultingSchema>({
    setRedux: add,
  });

  return (
    <FormField
      control={control}
      name="role"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel>役割・立場</RequiredLabel>
          <Textarea
            {...field}
            id="role"
            placeholder="例：新入社員のOJT担当者、プロジェクトマネージャー、品質管理責任者"
            className="min-h-[80px]"
            onKeyUp={(e) => {
              onChangeField({
                role: (e.target as HTMLTextAreaElement).value,
              });
            }}
          />
        </FormItem>
      )}
    />
  );
}
