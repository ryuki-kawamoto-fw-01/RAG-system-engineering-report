import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setNewProductIdea } from '@/app/_store/slice/new-product-idea';
import { NewProductIdeaSchema } from '../_utils/schema';

export default function IdeaDirectionForm() {
  const { onChangeField, control } = useFormReduxContext<NewProductIdeaSchema>({
    setRedux: setNewProductIdea,
  });

  return (
    <FormField
      control={control}
      name="ideaDirection"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel>アイデアの方向性</RequiredLabel>
          <Textarea
            {...field}
            onBlur={(e) => {
              onChangeField({ ideaDirection: e.target.value });
            }}
            placeholder="例：市場、類似商品、差別化ポイント。"
            className="mb-3 min-h-[150px]"
          />
        </FormItem>
      )}
    />
  );
}
