import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setCreateIdea } from '@/app/_store/slice/create-idea';
import { Textarea } from '../../../_components/ui/textarea';
import { CreateIdeaSchema } from '../_utils/schema';

export default function IdeationSubjectForm() {
  const { onChangeField, control } = useFormReduxContext<CreateIdeaSchema>({
    setRedux: setCreateIdea,
  });
  return (
    <div>
      <FormField
        control={control}
        name="subject"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>主題</RequiredLabel>
            <Textarea
              {...field}
              id="subject"
              placeholder="例：2025年の生成AIに対して企業が注力したほうがよいこと"
              className="min-h-[150px]"
              onKeyUp={(e) => {
                onChangeField({ subject: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
