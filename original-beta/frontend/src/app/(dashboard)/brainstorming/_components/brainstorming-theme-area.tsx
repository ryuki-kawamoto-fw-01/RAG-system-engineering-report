import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setBrainstorming } from '@/app/_store/slice/brainstorming';
import { Textarea } from '../../../_components/ui/textarea';
import { BrainstormingSchema } from '../_utils/schema';

export default function BrainstormingThemeArea() {
  const { onChangeField, control } = useFormReduxContext<BrainstormingSchema>({
    setRedux: setBrainstorming,
  });
  return (
    <div>
      <FormField
        control={control}
        name="theme"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>メインテーマ</RequiredLabel>
            <Textarea
              {...field}
              id="theme"
              placeholder={
                'テーマを入力してください\n例：社内業務を効率化するためのサービスで生成AIをどう活用できるか'
              }
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({ theme: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
