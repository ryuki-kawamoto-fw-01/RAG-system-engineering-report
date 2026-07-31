import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setDefectAnalysisReport } from '@/app/_store/slice/defect-analysis-report';
import { Textarea } from '../../../_components/ui/textarea';
import { DefectAnalysisReportSchema } from '../_utils/schema';

export default function DefectDescription() {
  const { onChangeField, control } = useFormReduxContext<DefectAnalysisReportSchema>({
    setRedux: setDefectAnalysisReport,
  });

  return (
    <FormField
      control={control}
      name="defectDescription"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel>不具合内容</RequiredLabel>
          <Textarea
            {...field}
            onBlur={(e) => {
              onChangeField({ defectDescription: e.target.value });
            }}
            placeholder="例：充電中にバッテリーが異常発熱し、最大60度まで温度が上昇する"
            className="min-h-[100px] w-full"
          />
        </FormItem>
      )}
    />
  );
}
