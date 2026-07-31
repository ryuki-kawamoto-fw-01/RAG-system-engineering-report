import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setDefectAnalysisReport } from '@/app/_store/slice/defect-analysis-report';
import { Textarea } from '../../../_components/ui/textarea';
import { DefectAnalysisReportSchema } from '../_utils/schema';

export default function DefectUsageEnvironment() {
  const { onChangeField, control } = useFormReduxContext<DefectAnalysisReportSchema>({
    setRedux: setDefectAnalysisReport,
  });

  return (
    <FormField
      control={control}
      name="usageEnvironment"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel>使用環境</RequiredLabel>
          <Textarea
            {...field}
            onBlur={(e) => {
              onChangeField({ usageEnvironment: e.target.value });
            }}
            placeholder="例：iOS 17.0以降のiPhone、Android 13以降のスマートフォン"
            className="min-h-[100px] w-full"
          />
        </FormItem>
      )}
    />
  );
}
