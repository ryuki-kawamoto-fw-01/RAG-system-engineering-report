import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setCreateIdea } from '@/app/_store/slice/create-idea';
import { Textarea } from '../../../_components/ui/textarea';
import { CreateIdeaSchema } from '../_utils/schema';

export default function IdeationRoleForm() {
  const { onChangeField, control } = useFormReduxContext<CreateIdeaSchema>({
    setRedux: setCreateIdea,
  });
  return (
    <div>
      <FormField
        control={control}
        name="role"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>立場</RequiredLabel>
            <Textarea
              {...field}
              id="subject"
              placeholder="例：生成AIのプロ、IT企業の経営者"
              className="min-h-[150px]"
              onKeyUp={(e) => {
                onChangeField({ role: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
