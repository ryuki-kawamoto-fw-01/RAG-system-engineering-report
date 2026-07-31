import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '@/app/_components/ui/button';
import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setBusinessPlan } from '@/app/_store/slice/business-plan';
import { Textarea } from '../../../_components/ui/textarea';
import { BusinessPlanReAnalysisSchema } from '../_utils/schema';

type Props = {
  className?: string;
};

export default function BusinessPlanReanalysisRequest({ className }: Props) {
  const {
    onChangeField,
    control,
    formState: { isSubmitting, isValid },
  } = useFormReduxContext<BusinessPlanReAnalysisSchema>({
    setRedux: setBusinessPlan,
  });

  return (
    <div className={className}>
      <FormField
        control={control}
        name="newBusinessPlanRequest"
        render={({ field }) => (
          <FormItem className="flex h-full flex-col">
            <RequiredLabel>結果を調整する</RequiredLabel>
            <Textarea
              {...field}
              onBlur={(e) => {
                onChangeField({ newBusinessPlanRequest: e.target.value });
              }}
              placeholder="例：初年度売り上げ目標を300万円にする"
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
            再作成中です
          </>
        ) : (
          '再作成する'
        )}
      </Button>
    </div>
  );
}
