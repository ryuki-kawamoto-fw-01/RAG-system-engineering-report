import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '@/app/_components/ui/button';
import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setCompanyAnalysis } from '@/app/_store/slice/company-analysis';
import { Textarea } from '../../../_components/ui/textarea';
import { CompanyReAnalysisSchema } from '../_utils/schema';

type Props = {
  className?: string;
};

export default function CompanyReanalysisRequest({ className }: Props) {
  const {
    onChangeField,
    control,
    formState: { isSubmitting, isValid },
  } = useFormReduxContext<CompanyReAnalysisSchema>({
    setRedux: setCompanyAnalysis,
  });

  return (
    <div className={className}>
      <FormField
        control={control}
        name="reanalysis_request"
        render={({ field }) => (
          <FormItem className="flex h-full flex-col">
            <RequiredLabel>結果を調整する</RequiredLabel>
            <Textarea
              {...field}
              onBlur={(e) => {
                onChangeField({ reanalysis_request: e.target.value });
              }}
              placeholder="例：分析範囲を国内に限定する"
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
