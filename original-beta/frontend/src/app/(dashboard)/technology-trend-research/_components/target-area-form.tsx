import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setTechnologyTrendResearch } from '@/app/_store/slice/technology-trend-research';
import { TechnologyTrendResearchSchema } from '../_utils/schema';

export default function TargetAreaForm() {
  const { onChangeField, control } = useFormReduxContext<TechnologyTrendResearchSchema>({
    setRedux: setTechnologyTrendResearch,
  });

  return (
    <div>
      <FormField
        control={control}
        name="area"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>対象の地域</RequiredLabel>
            <Textarea
              {...field}
              placeholder={`調査の地域を入力してください\n例：日本、グローバルなど`}
              className="min-h-[100px]"
              onKeyUp={(e) => {
                onChangeField({ area: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
