import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '@/app/_components/ui/button';
import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setDefectAnalysisReport } from '@/app/_store/slice/defect-analysis-report';
import { Textarea } from '../../../_components/ui/textarea';
import { DefectAnalysisReportReAnalysisSchema } from '../_utils/schema';

type Props = {
  className?: string;
};

export default function DefectReanalysisRequest({ className }: Props) {
  const {
    onChangeField,
    control,
    formState: { isSubmitting, isValid },
  } = useFormReduxContext<DefectAnalysisReportReAnalysisSchema>({
    setRedux: setDefectAnalysisReport,
  });

  return (
    <div className={className}>
      <FormField
        control={control}
        name="modify"
        render={({ field }) => (
          <FormItem className="flex h-full flex-col">
            <RequiredLabel>結果を調整する</RequiredLabel>
            <Textarea
              {...field}
              onBlur={(e) => {
                onChangeField({ modify: e.target.value });
              }}
              placeholder="例：実施計画をより具体的にし、各フェーズでの責任者と予算も含めて詳細化してください"
              className="size-full min-h-[100px] resize-none"
            />
          </FormItem>
        )}
      />
      <Button
        type="submit"
        variant="secondary"
        className="absolute bottom-0 left-1/2 w-full max-w-[180px] -translate-x-1/2"
        disabled={!isValid || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Spinner className="mr-2 size-6 animate-spin" />
            再分析中です
          </>
        ) : (
          '再分析する'
        )}
      </Button>
    </div>
  );
}
