import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { add } from '@/app/_store/slice/advice-consulting';
import { AdviceConsultingSchema } from '../_utils/schema';

export default function ConstraintsForm() {
  const { onChangeField, control } = useFormReduxContext<AdviceConsultingSchema>({
    setRedux: add,
  });

  return (
    <FormField
      control={control}
      name="constraints"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel>制約・条件</RequiredLabel>
          <Textarea
            {...field}
            id="constraints"
            placeholder="例：100字以内で簡潔に、実践的なアドバイスを提供"
            className="min-h-[80px]"
            onKeyUp={(e) => {
              onChangeField({
                constraints: (e.target as HTMLTextAreaElement).value,
              });
            }}
          />
        </FormItem>
      )}
    />
  );
}
