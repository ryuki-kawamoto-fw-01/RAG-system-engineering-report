import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { Spinner } from '@/app/_components/icon/decorative';
import { Form, FormField, FormItem, FormMessage } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import RequiredLabel from '@/app/_components/ui/required-label';
import { LAYOUT_RIGHT_ONLY, LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { add, setId, setResult } from '@/app/_store/slice/taskBreakdown';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { Button } from '../../../_components/ui/button';
import { Textarea } from '../../../_components/ui/textarea';
import { taskBreakdown } from '../_actions/taskBreakdown';
import { taskBreakdownSchema, TaskBreakdownSchema } from '../_utils/schema';

type Props = {
  className?: string;
  setIsTaskBreakdown: (isSubmitting: boolean) => void;
  switchLayout: (layout: LayoutType) => void;
};

export default function InputTaskBreakdownForm({
  className,
  setIsTaskBreakdown,
  switchLayout,
}: Props): JSX.Element {
  const dispatch = useAppDispatch();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const defaultValues = useAppSelector((state) => state.taskBreakdown);
  const form = useFormRedux<TaskBreakdownSchema>({
    resolver: zodResolver(taskBreakdownSchema),
    values: defaultValues,
    setRedux: add,
  });

  const {
    control,
    handleSubmit,
    onChangeField,
    formState: { isValid, isSubmitting },
  } = form;

  useEffect(() => {
    setIsTaskBreakdown(isSubmitting);
  }, [isSubmitting, setIsTaskBreakdown]);

  const handleTaskBreakdownInputSend = async (e: TaskBreakdownSchema) => {
    try {
      const id = uniqueId();
      const response = await taskBreakdown(id, e.task!, e.consideration ?? '');

      if (response.success) {
        const taskBreakdown = response.content;
        dispatch(setResult({ result: taskBreakdown, feedbackAt: undefined }));
        dispatch(setId(id));
        toast.success(getMessage('I_F_00030', '作成結果'));
        switchLayout(LAYOUT_RIGHT_ONLY);
      } else {
        toast.error(<ReactMarkdown>{response.message}</ReactMarkdown>);
      }
    } catch (error) {
      console.error('Error taskBreakdown:', error);
      toast.error(getMessage('E_F_00110', '作成結果'));
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(handleTaskBreakdownInputSend)}
        className={cn('relative flex h-full flex-col', className)}
      >
        <div className="flex-1 space-y-3 overflow-y-auto pb-[48px]">
          <FormField
            control={control}
            name="task"
            render={({ field }) => (
              <FormItem>
                <RequiredLabel>
                  <span>タスク分解したい業務</span>
                </RequiredLabel>
                <Textarea
                  {...field}
                  onBlur={(e) => {
                    onChangeField({
                      task: e.target.value,
                    });
                  }}
                  id="task"
                  className="min-h-[150px]"
                  placeholder="例：売上データを纏めて、月次報告書を作成する"
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="consideration"
            render={({ field }) => (
              <FormItem>
                <OptionalLabel>
                  <span>考慮事項</span>
                </OptionalLabel>
                <Textarea
                  {...field}
                  onBlur={(e) => {
                    onChangeField({
                      consideration: e.target.value,
                    });
                  }}
                  id="consideration"
                  className="min-h-[150px]"
                  placeholder="例：業務の背景、粒度、期限"
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          variant="secondary"
          disabled={!isValid || isSubmitting}
          className="absolute bottom-0 left-1/2 w-full max-w-[180px] -translate-x-1/2"
        >
          {isSubmitting ? (
            <>
              <Spinner className="mr-2 size-6 animate-spin" />
              <span>作成中です</span>
            </>
          ) : (
            <span>作成する</span>
          )}
        </Button>
      </form>
    </Form>
  );
}
