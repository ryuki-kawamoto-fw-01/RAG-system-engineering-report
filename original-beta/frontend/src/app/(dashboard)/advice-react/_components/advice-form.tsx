import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { add } from '@/app/_store/slice/advice-react';
import { AdviceReactSchema } from '../_utils/schema';

export default function AdviceInputForm() {
  const { onChangeField, control } = useFormReduxContext<AdviceReactSchema>({
    setRedux: add,
  });

  return (
    <FormField
      control={control}
      name="adviceInput"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel>アドバイスをもらいたいこと</RequiredLabel>
          <Textarea
            {...field}
            id="adviceInput"
            placeholder="例：～するにはどうすればよいですか？"
            className="min-h-[200px]"
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
