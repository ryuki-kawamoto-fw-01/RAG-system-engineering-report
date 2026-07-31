import { FormField, FormItem } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setTechnologyTrendResearch } from '@/app/_store/slice/technology-trend-research';
import { TechnologyTrendResearchSchema } from '../_utils/schema';

export default function ReportFormatForm() {
  const { onChangeField, control } = useFormReduxContext<TechnologyTrendResearchSchema>({
    setRedux: setTechnologyTrendResearch,
  });
  return (
    <div>
      <FormField
        control={control}
        name="format"
        render={({ field }) => (
          <FormItem>
            <OptionalLabel>考慮事項</OptionalLabel>
            <Textarea
              {...field}
              placeholder="例：簡単な要約、詳細な分析、表やグラフの指定など"
              onKeyUp={(e) => {
                onChangeField({ format: (e.target as HTMLTextAreaElement).value });
              }}
              className="min-h-[100px]"
            />
          </FormItem>
        )}
      />
    </div>
  );
}
