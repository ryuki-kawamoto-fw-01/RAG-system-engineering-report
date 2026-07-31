import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setCompanyAnalysis } from '@/app/_store/slice/company-analysis';
import { Textarea } from '../../../_components/ui/textarea';
import { AnalysisId, CompanyAnalysisSchema } from '../_utils/schema';

export default function CompanyBusinessName(): JSX.Element {
  const { onChangeField, watch, control } = useFormReduxContext<CompanyAnalysisSchema>({
    setRedux: setCompanyAnalysis,
  });
  const analysis: AnalysisId[] = watch('analytical_methods', []);
  const isBusinessName = analysis.some((data) => data === 'fiveforce' || data === 'pest');

  return isBusinessName ? (
    <FormField
      control={control}
      name="business_name"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel>事業名</RequiredLabel>
          <div className="relative pt-1">
            <Textarea
              {...field}
              id="revisionPrompt"
              className="min-h-[150px]"
              placeholder="例：日本国内の製造業"
              onBlur={(e) => {
                onChangeField({ business_name: e.target.value });
              }}
            />
          </div>
        </FormItem>
      )}
    />
  ) : (
    <></>
  );
}
