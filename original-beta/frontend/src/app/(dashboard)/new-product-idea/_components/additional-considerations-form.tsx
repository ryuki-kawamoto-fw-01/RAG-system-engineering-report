import { FormField, FormItem } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setNewProductIdea } from '@/app/_store/slice/new-product-idea';
import { NewProductIdeaSchema } from '../_utils/schema';

export default function AdditionalConsiderationsForm() {
  const { onChangeField, control } = useFormReduxContext<NewProductIdeaSchema>({
    setRedux: setNewProductIdea,
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
            onBlur={(e) => {
              onChangeField({ additionalConsiderations: e.target.value });
            }}
            placeholder="実現性の高いアイデアを出力すること。"
            className="min-h-[150px]"
          />
        </FormItem>
      )}
    />
  );
}
