import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setBrainstorming } from '@/app/_store/slice/brainstorming';
import { Textarea } from '../../../_components/ui/textarea';
import { BrainstormingSchema } from '../_utils/schema';

export default function BrainstormingExpert1Area() {
  const { onChangeField, control } = useFormReduxContext<BrainstormingSchema>({
    setRedux: setBrainstorming,
  });
  return (
    <div>
      <FormField
        control={control}
        name="expert1"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>専門家１</RequiredLabel>
            <Textarea
              {...field}
              id="expert1"
              placeholder={'アイデアをもらいたい専門家を入力してください\n例：市場アナリスト'}
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({ expert1: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
