import { FormField, FormItem } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setCreateIdea } from '@/app/_store/slice/create-idea';
import { Textarea } from '../../../_components/ui/textarea';
import { CreateIdeaSchema } from '../_utils/schema';

export default function IdeationConsiderationForm() {
  const { onChangeField, control } = useFormReduxContext<CreateIdeaSchema>({
    setRedux: setCreateIdea,
  });
  return (
    <div>
      <FormField
        control={control}
        name="consideration"
        render={({ field }) => (
          <FormItem>
            <OptionalLabel>考慮事項</OptionalLabel>
            <Textarea
              {...field}
              placeholder="例：専門用語を控える"
              onKeyUp={(e) => {
                onChangeField({ consideration: (e.target as HTMLTextAreaElement).value });
              }}
              className="min-h-[150px]"
            />
          </FormItem>
        )}
      />
    </div>
  );
}
