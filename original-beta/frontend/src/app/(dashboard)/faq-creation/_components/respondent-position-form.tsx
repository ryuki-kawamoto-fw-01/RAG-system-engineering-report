import { FormField, FormItem } from '@/app/_components/ui/form';
import { Input } from '@/app/_components/ui/input';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { updateFaqInput } from '@/app/_store/slice/faq-creation';
import { FaqcreationSchema } from '../util/schema';

export default function RespondentPositionForm() {
  const { onChangeField, control } = useFormReduxContext<FaqcreationSchema>({
    setRedux: updateFaqInput,
  });
  return (
    <FormField
      control={control}
      name="respondentPosition"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel>回答者の立場</RequiredLabel>
          <Input
            {...field}
            id="respondentPosition"
            type="text"
            className="mt-2"
            inputSize="lg"
            placeholder="例：生成AIのプロ"
            onKeyUp={(e) => {
              onChangeField({ respondentPosition: (e.target as HTMLTextAreaElement).value });
            }}
          />
        </FormItem>
      )}
    />
  );
}
