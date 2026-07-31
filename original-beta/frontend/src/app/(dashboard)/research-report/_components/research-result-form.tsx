import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setResearchReport } from '@/app/_store/slice/research-report';
import { Textarea } from '../../../_components/ui/textarea';
import { ResearchReportSchema } from '../_utils/schema';

export default function ResultForm() {
  const { onChangeField, control } = useFormReduxContext<ResearchReportSchema>({
    setRedux: setResearchReport,
  });
  return (
    <div>
      <FormField
        control={control}
        name="researchresult"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>研究の仮説と結果</RequiredLabel>
            <Textarea
              {...field}
              id="researchresult"
              placeholder="得られたデータや傾向（例：GPT-4は他モデルより15%高い結果を示した）"
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({ researchresult: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
