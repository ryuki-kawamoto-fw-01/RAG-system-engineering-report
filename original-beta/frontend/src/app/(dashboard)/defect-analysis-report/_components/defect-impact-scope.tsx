import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setDefectAnalysisReport } from '@/app/_store/slice/defect-analysis-report';
import { Textarea } from '../../../_components/ui/textarea';
import { DefectAnalysisReportSchema } from '../_utils/schema';

export default function DefectImpactScope() {
  const { onChangeField, control } = useFormReduxContext<DefectAnalysisReportSchema>({
    setRedux: setDefectAnalysisReport,
  });

  return (
    <FormField
      control={control}
      name="impactScope"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel>影響範囲</RequiredLabel>
          <Textarea
            {...field}
            onBlur={(e) => {
              onChangeField({ impactScope: e.target.value });
            }}
            placeholder="例：対象製品：2024年4月〜2024年8月製造分（約50,000個）、報告件数：127件"
            className="min-h-[100px] w-full"
          />
        </FormItem>
      )}
    />
  );
}
