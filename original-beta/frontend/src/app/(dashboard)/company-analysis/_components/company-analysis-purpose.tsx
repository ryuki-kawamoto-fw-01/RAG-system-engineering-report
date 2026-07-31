import { FormField, FormItem } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setCompanyAnalysis } from '@/app/_store/slice/company-analysis';
import { Textarea } from '../../../_components/ui/textarea';
import { CompanyAnalysisSchema } from '../_utils/schema';

export default function CompanyAnalysisPurpose(): JSX.Element {
  const { onChangeField, control } = useFormReduxContext<CompanyAnalysisSchema>({
    setRedux: setCompanyAnalysis,
  });

  return (
    <FormField
      control={control}
      name="analysis_purpose"
      render={({ field }) => (
        <FormItem>
          <OptionalLabel>分析の目的や背景</OptionalLabel>
          <Textarea
            {...field}
            id="revisionPrompt"
            className="min-h-[150px] w-full"
            placeholder="例：成長戦略の策定のため"
            onBlur={(e) => {
              onChangeField({ analysis_purpose: e.target.value });
            }}
          />
        </FormItem>
      )}
    />
  );
}
