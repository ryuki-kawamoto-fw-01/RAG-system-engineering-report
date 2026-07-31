import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setJudgeIdea } from '@/app/_store/slice/judge-idea';
import { Textarea } from '../../../_components/ui/textarea';
import { JudgeIdeaSchema } from '../_utils/schema';

export default function IdeationMarketForm() {
  const { onChangeField, control } = useFormReduxContext<JudgeIdeaSchema>({
    setRedux: setJudgeIdea,
  });
  return (
    <div>
      <FormField
        control={control}
        name="market"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>新製品のアイデアの市場</RequiredLabel>
            <Textarea
              {...field}
              id="subject"
              placeholder="例：都市部の通勤者、学生"
              className="min-h-[150px]"
              onKeyUp={(e) => {
                onChangeField({ market: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
