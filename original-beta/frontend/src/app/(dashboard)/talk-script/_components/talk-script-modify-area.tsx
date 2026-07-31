// トークスクリプト修正エリア
import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '@/app/_components/ui/button';
import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setModify } from '@/app/_store/slice/talk-script';
import { Textarea } from '../../../_components/ui/textarea';
import { ModifiedTalkScriptSchema } from '../_utils/schema';

type Props = {
  className?: string;
};

export default function TalkScriptModifyArea({ className }: Props) {
  const {
    control,
    onChangeField,
    formState: { isValid, isSubmitting },
  } = useFormReduxContext<ModifiedTalkScriptSchema>({
    setRedux: setModify,
  });

  return (
    <div className={className}>
      <FormField
        control={control}
        name="modify"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>結果を調整する</RequiredLabel>
            <Textarea
              {...field}
              onBlur={(e) => {
                onChangeField(e.target.value);
              }}
              placeholder="作成結果を修正するための指示を入力してください。"
              className="min-h-[100px] resize-none"
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
