import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { add } from '@/app/_store/slice/advice-consulting';
import { AdviceConsultingSchema } from '../_utils/schema';

export default function AdviceInputForm() {
  const { onChangeField, control } = useFormReduxContext<AdviceConsultingSchema>({
    setRedux: add,
  });

  return (
    <FormField
      control={control}
      name="adviceInput"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel>相談内容</RequiredLabel>
          <Textarea
            {...field}
            id="adviceInput"
            placeholder="例：新入社員が業務に慣れずモチベーションが下がっています。どのようにサポートすれば良いでしょうか？"
            className="min-h-[150px]"
            onKeyUp={(e) => {
              onChangeField({
                adviceInput: (e.target as HTMLTextAreaElement).value,
              });
            }}
          />
        </FormItem>
      )}
    />
  );
}
