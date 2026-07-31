// 修正エリア
import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '@/app/_components/ui/button';
import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setModify } from '@/app/_store/slice/create-mail';
import { Textarea } from '../../../_components/ui/textarea';
import { ModifyMailSchema } from '../_utils/schema';

type Props = {
  className?: string;
};

export function ModifyArea({ className }: Props) {
  const {
    onChangeField,
    control,
    formState: { isSubmitting, isValid },
  } = useFormReduxContext<ModifyMailSchema>({
    setRedux: setModify,
  });

  return (
    <div className={className}>
      <FormField
        control={control}
        name="modify"
        render={({ field }) => (
          <FormItem className="flex h-full flex-col">
            <RequiredLabel>結果を調整する</RequiredLabel>
            <Textarea
              {...field}
              onChange={(e) => {
                field.onChange(e);
                onChangeField(e.target.value);
              }}
              placeholder={`作成結果を修正するための指示を入力してください。\n例：事前情報がない人にも分かるように修正してください。`}
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
    </div>
  );
}
