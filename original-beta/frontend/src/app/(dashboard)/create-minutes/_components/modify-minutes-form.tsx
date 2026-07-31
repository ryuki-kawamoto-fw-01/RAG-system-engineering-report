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
import { selectCreateMinutes } from '@/app/_store/selectors/create-minutes';
import { setCreateMinutes, setResult } from '@/app/_store/slice/create-minutes';
import { getMessage } from '@/app/_utils/message';
import { fixMinutes } from '../_actions/fixMinutes';
import { FixMinutesSchema, fixMinutesSchema } from '../_utils/schema';

type Props = {
  className?: string;
  switchLayout: (layout: LayoutType) => void;
};

export default function ModifyMinutesForm({ className, switchLayout }: Props): JSX.Element {
  const dispatch = useAppDispatch();
  const { fileList, result, revisionPrompt, feedbackAt, ...defaultValues } =
    useAppSelector(selectCreateMinutes);
  const form = useFormRedux<FixMinutesSchema>({
    resolver: zodResolver(fixMinutesSchema),
    values: {
      fileList,
      resultMinutes: result,
      revisionPrompt,
    } as FixMinutesSchema,
    setRedux: setCreateMinutes,
  });

  const {
    control,
    handleSubmit,
    onChangeField,
    formState: { isValid, isSubmitting },
  } = form;

  const handleRevisionPromptSend = async (e: FixMinutesSchema) => {
    const formData = new FormData();
    // fileListはFileReferenceの配列なのでJSON文字列として送信
    formData.append('fileList', JSON.stringify(e.fileList));
    formData.append('resultMinutes', result);
    formData.append('revisionPrompt', e.revisionPrompt!);

    const response = await fixMinutes(formData, defaultValues.id);

    if (response.success) {
      const fixMinutes = response.content;
      dispatch(setResult({ result: fixMinutes, feedbackAt }));
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
                placeholder={`議事録を修正するための指示を入力してください\n例：・決定事項を詳細に記述する\n　　・発言者を明確に記録する`}
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
