import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '@/app/_components/ui/button';
import { Form, FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';

import { LAYOUT_RIGHT_ONLY, LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { add, setResult } from '@/app/_store/slice/taskBreakdown';
import { getMessage } from '@/app/_utils/message';
import { fixTaskBreakdown } from '../_actions/fix-taskBreakdown';
import { FixTaskBreakdownSchema, fixTaskBreakdownSchema } from '../_utils/schema';

type Props = {
  className?: string;
  switchLayout: (layout: LayoutType) => void;
};

export default function ModifyTaskBreakdownForm({ className, switchLayout }: Props): JSX.Element {
  const dispatch = useAppDispatch();
  const { result, revisionPrompt, feedbackAt, ...defaultValues } = useAppSelector(
    (state) => state.taskBreakdown
  );
  const form = useFormRedux<FixTaskBreakdownSchema>({
    resolver: zodResolver(fixTaskBreakdownSchema),
    values: {
      result,
      revisionPrompt: revisionPrompt ?? '',
    },
    setRedux: add,
  });

  const {
    control,
    handleSubmit,
    onChangeField,
    formState: { isValid, isSubmitting },
  } = form;

  const handleRevisionPromptSend = async (e: FixTaskBreakdownSchema) => {
    const response = await fixTaskBreakdown(result, e.revisionPrompt!, defaultValues.id);

    if (response.success) {
      const fixTaskBreakdown = response.content;
      dispatch(setResult({ result: fixTaskBreakdown, feedbackAt }));
      toast.success(getMessage('I_F_00040', '作成結果'));
      switchLayout(LAYOUT_RIGHT_ONLY);
    } else {
      toast.error(response.message);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(handleRevisionPromptSend)} className={className}>
        <FormField
          control={control}
          name="revisionPrompt"
          render={({ field }) => (
            <FormItem className="flex h-full flex-col">
              <RequiredLabel>結果を調整する</RequiredLabel>
              <Textarea
                {...field}
                onBlur={(e) => {
                  onChangeField({ revisionPrompt: e.target.value });
                }}
                placeholder={`作成結果を修正するための指示を入力してください\n例：資料作成後、関係者レビューを追加する`}
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
              再作成中です
            </>
          ) : (
            '再作成する'
          )}
        </Button>
      </form>
    </Form>
  );
}
