import { zodResolver } from '@hookform/resolvers/zod';
import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '@/app/_components/ui/button';
import { Form, FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppSelector } from '@/app/_store/hooks';
import { setCreatePrompt } from '@/app/_store/slice/create-prompt';
import { FixPromptSchema, fixPromptSchema } from '../_utils/schema';

type Props = {
  onSubmit: (data: FixPromptSchema) => Promise<void>;
  className?: string;
};

export default function ModifyPromptForm({ onSubmit, className }: Props) {
  const { result, revisionPrompt } = useAppSelector((state) => state.createPrompt);

  const form = useFormRedux<FixPromptSchema>({
    resolver: zodResolver(fixPromptSchema),
    defaultValues: { result, revisionPrompt },
    values: { result, revisionPrompt },
    setRedux: setCreatePrompt,
  });

  const {
    control,
    handleSubmit,
    onChangeField,
    formState: { isValid, isSubmitting },
  } = form;

  const handleFixPrompt = async (data: FixPromptSchema) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(handleFixPrompt)} className={className}>
        <FormField
          control={control}
          name="revisionPrompt"
          render={({ field }) => (
            <FormItem className="flex h-full flex-col">
              <RequiredLabel>結果を修正する</RequiredLabel>
              <Textarea
                {...field}
                onKeyUp={(e) => {
                  onChangeField({ revisionPrompt: (e.target as HTMLTextAreaElement).value });
                }}
                placeholder={`プロンプトテンプレートを修正するための指示を入力してください\n例：・専門用語をできるだけ使用しない\n　　・文を短くし、簡潔にまとめる`}
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
