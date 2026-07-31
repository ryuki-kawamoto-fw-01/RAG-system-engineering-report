import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '@/app/_components/ui/button';
import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setNewJudgeIdeaRequest } from '@/app/_store/slice/judge-idea';

import { Textarea } from '../../../_components/ui/textarea';

import { JudgeNewIdeaSchema } from '../_utils/schema';

type Props = {
  className?: string;
};

export default function NewIdeaRequestForm({ className }: Props) {
  const {
    control,
    onChangeField,
    formState: { isSubmitting, isValid },
  } = useFormReduxContext<JudgeNewIdeaSchema>({
    setRedux: setNewJudgeIdeaRequest,
  });

  return (
    <div className={className}>
      <FormField
        control={control}
        name="newJudgeRequest"
        render={({ field }) => (
          <FormItem className="flex h-full flex-col">
            <RequiredLabel>結果を調整する</RequiredLabel>
            <Textarea
              {...field}
              onBlur={(e) => {
                onChangeField(e.target.value);
              }}
              placeholder="例：簡潔にまとめる"
              className="size-full min-h-[100px] resize-none"
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
            再評価中です
          </>
        ) : (
          '再評価する'
        )}
      </Button>
    </div>
  );
}
