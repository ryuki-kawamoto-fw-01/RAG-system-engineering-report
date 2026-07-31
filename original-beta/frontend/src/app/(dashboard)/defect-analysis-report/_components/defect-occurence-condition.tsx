import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setDefectAnalysisReport } from '@/app/_store/slice/defect-analysis-report';
import { Textarea } from '../../../_components/ui/textarea';
import { DefectAnalysisReportSchema } from '../_utils/schema';

export default function DefectOccurenceCondition() {
  const { onChangeField, control } = useFormReduxContext<DefectAnalysisReportSchema>({
    setRedux: setDefectAnalysisReport,
  });

  return (
    <FormField
      control={control}
      name="occurenceCondition"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel>発生条件</RequiredLabel>
          <Textarea
            {...field}
            onBlur={(e) => {
              onChangeField({ occurenceCondition: e.target.value });
            }}
            placeholder="例：急速充電機能を使用し、バッテリー残量が20%以下の状態から充電を開始した場合"
            className="min-h-[100px] w-full"
          />
        </FormItem>
      )}
    />
  );
}
