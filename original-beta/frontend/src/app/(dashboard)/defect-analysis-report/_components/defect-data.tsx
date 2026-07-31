import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setDefectAnalysisReport } from '@/app/_store/slice/defect-analysis-report';
import { Textarea } from '../../../_components/ui/textarea';
import { DefectAnalysisReportSchema } from '../_utils/schema';

export default function DefectData() {
  const { onChangeField, control } = useFormReduxContext<DefectAnalysisReportSchema>({
    setRedux: setDefectAnalysisReport,
  });

  return (
    <FormField
      control={control}
      name="defectData"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel>不具合データ</RequiredLabel>
          <Textarea
            {...field}
            onBlur={(e) => {
              onChangeField({ defectData: e.target.value });
            }}
            placeholder="例：温度測定データ：平均最高温度58.7度、内部抵抗値：正常範囲50-70mΩ→異常時120-150mΩ"
            className="min-h-[100px] w-full"
          />
        </FormItem>
      )}
    />
  );
}
