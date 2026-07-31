import { FormField, FormItem } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setCompanyAnalysis } from '@/app/_store/slice/company-analysis';
import { Textarea } from '../../../_components/ui/textarea';
import { CompanyAnalysisSchema } from '../_utils/schema';

export default function CompanyAnalysisConsiderationsArea() {
  const { onChangeField, control } = useFormReduxContext<CompanyAnalysisSchema>({
    setRedux: setCompanyAnalysis,
  });

  return (
    <FormField
      control={control}
      name="analysis_considerations"
      render={({ field }) => (
        <FormItem>
          <OptionalLabel>特定の市場や背景</OptionalLabel>
          <Textarea
            {...field}
            onBlur={(e) => {
              onChangeField({ analysis_considerations: e.target.value });
            }}
            placeholder="例：簡潔にまとめる"
            className="min-h-[150px] w-full"
          />
        </FormItem>
      )}
    />
  );
}
