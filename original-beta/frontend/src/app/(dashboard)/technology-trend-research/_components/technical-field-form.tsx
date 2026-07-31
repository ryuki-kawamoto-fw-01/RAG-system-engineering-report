import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setTechnologyTrendResearch } from '@/app/_store/slice/technology-trend-research';
import { TechnologyTrendResearchSchema } from '../_utils/schema';

export default function TechnicalFieldForm() {
  const { onChangeField, control } = useFormReduxContext<TechnologyTrendResearchSchema>({
    setRedux: setTechnologyTrendResearch,
  });
  return (
    <div>
      <FormField
        control={control}
        name="field"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>焦点を当てる技術分野</RequiredLabel>
            <Textarea
              {...field}
              placeholder={`調査の対象とする技術分野を入力してください\n例：AI、ブロックチェーン、バイオテクノロジーなど`}
              className="min-h-[100px]"
              onKeyUp={(e) => {
                onChangeField({ field: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
