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
import { add, setResult } from '@/app/_store/slice/sales-forecast';
import { getMessage } from '@/app/_utils/message';
import { fixSalesForecast } from '../_actions/fix-sales-forecast';
import { FixSalesForecastSchema, fixSalesForecastSchema } from '../_utils/schema';

type Props = {
  className?: string;
  switchLayout: (layout: LayoutType) => void;
};

export default function ModifyForm({ className, switchLayout }: Props): JSX.Element {
  const dispatch = useAppDispatch();
  const { result, revisionPrompt, feedbackAt, ...defaultValues } = useAppSelector(
    (state) => state.salesForecast
  );
  const form = useFormRedux<FixSalesForecastSchema>({
    resolver: zodResolver(fixSalesForecastSchema), // 入力のバリデーションチェック
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

  const handleRevisionPromptSend = async (e: FixSalesForecastSchema) => {
    const response = await fixSalesForecast(result, e.revisionPrompt!, defaultValues.id);
    // API受取成功時
    if (response.success) {
      const fixSalesForecast = response.content;
      dispatch(setResult({ result: fixSalesForecast, feedbackAt }));
      toast.success(getMessage('I_F_00040', '作成結果'));
      switchLayout(LAYOUT_RIGHT_ONLY);
      // API受取失敗時
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
                placeholder={`作成結果を修正するための指示を入力してください\n例：各セクション3行以内、箇条書きのみで出力してください。数式や注記は省略し、最後に1行サマリー「結論/最大レバー/直近アクション」を追加してください。`}
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
              再分析中です
            </>
          ) : (
            '再分析する'
          )}
        </Button>
      </form>
    </Form>
  );
}
