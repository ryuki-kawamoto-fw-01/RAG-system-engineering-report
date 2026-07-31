'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '@/app/_components/ui/button';
import { Form, FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';

import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { selectSupposedQuestion } from '@/app/_store/selectors/supposed-question';
import { setModified, setResult } from '@/app/_store/slice/supposed-question';
import { getMessage } from '@/app/_utils/message';
import { modifySupposedQuestion } from '../_actions/modifySupposedQuestion';
import { ModifiedSupposedQuestionSchema, modifiedSupposedQuestionSchema } from '../_utils/schema';

type Props = {
  className?: string;
};

export default function SupposedQuestionModifyForm({ className }: Props) {
  const dispatch = useAppDispatch();
  const { result, modified, temp_file, id, feedbackAt } = useAppSelector(selectSupposedQuestion);
  const { onChangeField, ...form } = useFormRedux<ModifiedSupposedQuestionSchema>({
    resolver: zodResolver(modifiedSupposedQuestionSchema),
    values: {
      result,
      description: modified,
      temp_file,
    } as ModifiedSupposedQuestionSchema,
    setRedux: setModified,
  });
  const { isValid, isSubmitting } = form.formState;

  const handleSubmit = async (e: ModifiedSupposedQuestionSchema) => {
    try {
      const formData = new FormData();
      formData.append('description', String(e.description));

      formData.append(
        'qa_list',
        JSON.stringify([
          {
            description: e.description,
            content: result,
          },
        ])
      );
      formData.append('temp_file', JSON.stringify(e.temp_file));

      const res = await modifySupposedQuestion(formData, id);
      if (res.success) {
        dispatch(
          setResult({
            result: res.content ?? '',
            temp_file: e.temp_file ?? '',
            feedbackAt,
          })
        );
        toast.success(getMessage('I_F_00040', '作成結果'));
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      console.error('Error modifying supposed question:', error);
      toast.error(getMessage('E_F_00110', '作成結果'));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={className}>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="flex h-full flex-col">
              <RequiredLabel>想定質問を修正する</RequiredLabel>
              <Textarea
                {...field}
                onBlur={(e) => {
                  onChangeField(e.target.value);
                }}
                placeholder="作成結果を修正するための指示を入力してください"
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
