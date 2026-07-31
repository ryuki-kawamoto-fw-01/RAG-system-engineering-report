import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setTechnologyTraining } from '@/app/_store/slice/technology-training';
import { Textarea } from '../../../_components/ui/textarea';
import { TechnologyTrainingSchema } from '../_utils/schema';

export default function TrainingForm() {
  const { onChangeField, control } = useFormReduxContext<TechnologyTrainingSchema>({
    setRedux: setTechnologyTraining,
  });
  return (
    <div>
      <FormField
        control={control}
        name="technology"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>学習したい技術</RequiredLabel>
            <Textarea
              {...field}
              id="subject"
              placeholder="例：生成AI"
              className="min-h-[150px]"
              onKeyUp={(e) => {
                onChangeField({ technology: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
