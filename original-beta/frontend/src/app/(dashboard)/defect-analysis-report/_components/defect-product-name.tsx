import { FormField, FormItem } from '@/app/_components/ui/form';
import { Input } from '@/app/_components/ui/input';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setDefectAnalysisReport } from '@/app/_store/slice/defect-analysis-report';
import { DefectAnalysisReportSchema } from '../_utils/schema';

export default function DefectProductName(): JSX.Element {
  const { onChangeField, control } = useFormReduxContext<DefectAnalysisReportSchema>({
    setRedux: setDefectAnalysisReport,
  });

  return (
    <FormField
      control={control}
      name="productName"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel>製品名</RequiredLabel>
          <Input
            {...field}
            placeholder="例：スマートフォン用バッテリー Model ABC-123"
            onBlur={(e) => {
              onChangeField({ productName: e.target.value });
            }}
          />
        </FormItem>
      )}
    />
  );
}
