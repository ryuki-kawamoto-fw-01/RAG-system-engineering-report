import { zodResolver } from '@hookform/resolvers/zod';
import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '@/app/_components/ui/button';
import { Form, FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppSelector } from '@/app/_store/hooks';
import { setCreatePrompt } from '@/app/_store/slice/create-prompt';
import { cn } from '@/app/_utils/tw-merge';
import { CreatePromptSchema, createPromptSchema } from '../_utils/schema';

interface CreatePromptFormProps {
  className?: string;
  onSubmit: (data: CreatePromptSchema) => Promise<void>;
}

export default function CreatePromptForm({ className, onSubmit }: CreatePromptFormProps) {
  const { originalPrompt } = useAppSelector((state) => state.createPrompt);

  const form = useFormRedux<CreatePromptSchema>({
    resolver: zodResolver(createPromptSchema),
    defaultValues: { originalPrompt },
    values: { originalPrompt },
    setRedux: setCreatePrompt,
  });

  const {
    control,
    handleSubmit,
    onChangeField,
    formState: { isValid, isSubmitting },
  } = form;

  const createPrompt = async (data: CreatePromptSchema) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form
        className={cn('flex flex-col h-full relative', className)}
        onSubmit={handleSubmit(createPrompt)}
      >
        <div className="flex-1 space-y-3 overflow-y-auto pb-[48px]">
          <FormField
            control={control}
            name="originalPrompt"
            render={({ field }) => (
              <FormItem>
                <RequiredLabel>イメージ・キーワード</RequiredLabel>
                <Textarea
                  {...field}
                  className="mb-3 min-h-[150px] w-full"
                  onKeyUp={(e) => {
                    onChangeField({ originalPrompt: (e.target as HTMLTextAreaElement).value });
                  }}
                  placeholder="例：新商品の特徴をもとにキャッチコピーを作成してくれるプロンプト"
                />
              </FormItem>
            )}
          />
        </div>
        <Button
          variant="secondary"
          disabled={!isValid || isSubmitting}
          className="absolute bottom-0 left-1/2 w-full max-w-[180px] -translate-x-1/2"
        >
          {isSubmitting ? (
            <>
              <Spinner className="mr-2 size-6 animate-spin" />
              作成中です
            </>
          ) : (
            '作成する'
          )}
        </Button>
      </form>
    </Form>
  );
}
