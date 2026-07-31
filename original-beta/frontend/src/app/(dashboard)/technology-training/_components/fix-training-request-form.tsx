import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '@/app/_components/ui/button';
import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setFixTrainingRequest } from '@/app/_store/slice/technology-training';
import { cn } from '@/app/_utils/tw-merge';
import { Textarea } from '../../../_components/ui/textarea';
import { FixTrainingSchema } from '../_utils/schema';

type Props = {
  className?: string;
};

export default function FixTrainingRequestForm({ className }: Props) {
  const {
    control,
    onChangeField,
    formState: { isSubmitting, isValid },
  } = useFormReduxContext<FixTrainingSchema>({
    setRedux: setFixTrainingRequest,
  });

  return (
    <div className={cn('flex flex-col h-full relative', className)}>
      <FormField
        control={control}
        name="fixTrainingRequest"
        render={({ field }) => (
          <FormItem className="flex h-full flex-col">
            <RequiredLabel className="mb-2">結果を調整する</RequiredLabel>
            <Textarea
              {...field}
              onBlur={(e) => {
                onChangeField(e.target.value);
              }}
              placeholder="例：簡潔にまとめる"
              className="mb-12 min-h-[80px] flex-1 resize-none"
            />
          </FormItem>
        )}
      />
      <Button
        type="submit"
        variant="secondary"
        disabled={!isValid || isSubmitting}
        className="absolute bottom-0 left-1/2 w-full max-w-[180px] -translate-x-1/2"
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
