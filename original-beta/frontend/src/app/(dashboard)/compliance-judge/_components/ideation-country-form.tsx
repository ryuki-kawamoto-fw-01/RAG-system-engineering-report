import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setJudgeIdea } from '@/app/_store/slice/judge-idea';
import { Textarea } from '../../../_components/ui/textarea';
import { JudgeIdeaSchema } from '../_utils/schema';

export default function IdeationCountryForm() {
  const { onChangeField, control } = useFormReduxContext<JudgeIdeaSchema>({
    setRedux: setJudgeIdea,
  });
  return (
    <div>
      <FormField
        control={control}
        name="country"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>法的評価を実施したい国や地域</RequiredLabel>
            <Textarea
              {...field}
              id="subject"
              placeholder="例：日本"
              className="min-h-[150px]"
              onKeyUp={(e) => {
                onChangeField({ country: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
