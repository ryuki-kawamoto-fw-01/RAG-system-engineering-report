import { FormField, FormItem, FormMessage } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { updateFaqInput } from '@/app/_store/slice/faq-creation';
import { FaqcreationSchema } from '../util/schema';

export default function FaqInputForm() {
  const { onChangeField, control } = useFormReduxContext<FaqcreationSchema>({
    setRedux: updateFaqInput, // 修正：適切なアクションを使用
  });

  return (
    <FormField
      control={control}
      name="text"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel>FAQを作成したい内容</RequiredLabel>
          <Textarea
            {...field}
            className="min-h-[150px]"
            onKeyUp={(e) => {
              onChangeField({ text: (e.target as HTMLTextAreaElement).value });
            }}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
