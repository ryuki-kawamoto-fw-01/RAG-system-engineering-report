import { FormField, FormItem } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setDefectAnalysisReport } from '@/app/_store/slice/defect-analysis-report';
import { Textarea } from '../../../_components/ui/textarea';
import { DefectAnalysisReportSchema } from '../_utils/schema';

export default function DefectConsideration() {
  const { onChangeField, control } = useFormReduxContext<DefectAnalysisReportSchema>({
    setRedux: setDefectAnalysisReport,
  });

  return (
    <FormField
      control={control}
      name="consideration"
      render={({ field }) => (
        <FormItem>
          <OptionalLabel>分析時の考慮事項</OptionalLabel>
          <Textarea
            {...field}
            onBlur={(e) => {
              onChangeField({ consideration: e.target.value });
            }}
            placeholder="例：製品のブランドイメージへの影響を最小限に抑えつつ、ユーザーの安全を最優先とした分析を実施してください"
            className="min-h-[100px] w-full"
          />
        </FormItem>
      )}
    />
  );
}
