import { FormField, FormItem } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { updateFaqInput } from '@/app/_store/slice/faq-creation';
import { FaqcreationSchema } from '../util/schema';

export default function FaqConsiderationForm() {
  const { onChangeField, control } = useFormReduxContext<FaqcreationSchema>({
    setRedux: updateFaqInput,
  });

  return (
    <FormField
      control={control}
      name="additionalConsiderations"
      render={({ field }) => (
        <FormItem>
          <OptionalLabel>考慮事項</OptionalLabel>
          <Textarea
            {...field}
            className="min-h-[150px]"
            placeholder="例：専門用語を控える"
            onKeyUp={(e) => {
              onChangeField({ additionalConsiderations: (e.target as HTMLTextAreaElement).value });
            }}
          />
        </FormItem>
      )}
    />
  );
}
