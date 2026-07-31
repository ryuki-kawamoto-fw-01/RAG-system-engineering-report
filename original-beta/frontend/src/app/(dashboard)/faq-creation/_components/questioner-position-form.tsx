import { FormField, FormItem } from '@/app/_components/ui/form';
import { Input } from '@/app/_components/ui/input';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { updateFaqInput } from '@/app/_store/slice/faq-creation';
import { FaqcreationSchema } from '../util/schema';

export default function QuestionerPositionForm() {
  const { onChangeField, control } = useFormReduxContext<FaqcreationSchema>({
    setRedux: updateFaqInput,
  });
  return (
    <FormField
      control={control}
      name="questionerPosition"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel>質問者の立場</RequiredLabel>
          <Input
            {...field}
            id="questionerPosition"
            type="text"
            className="mt-2"
            inputSize="lg"
            placeholder="例：生成AIについて詳しくない現場社員"
            onKeyUp={(e) => {
              onChangeField({ questionerPosition: (e.target as HTMLTextAreaElement).value });
            }}
          />
        </FormItem>
      )}
    />
  );
}
