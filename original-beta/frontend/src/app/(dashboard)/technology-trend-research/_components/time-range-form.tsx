import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setTechnologyTrendResearch } from '@/app/_store/slice/technology-trend-research';
import { TechnologyTrendResearchSchema } from '../_utils/schema';

export default function TimeRangeForm() {
  const { onChangeField, control } = useFormReduxContext<TechnologyTrendResearchSchema>({
    setRedux: setTechnologyTrendResearch,
  });
  return (
    <div>
      <FormField
        control={control}
        name="range"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>調査の時間範囲</RequiredLabel>
            <Textarea
              {...field}
              placeholder="調査対象の期間を入力してください　例：過去１年のトレンド、特定の都市の願望など"
              className="min-h-[100px]"
              onKeyUp={(e) => {
                onChangeField({ range: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
