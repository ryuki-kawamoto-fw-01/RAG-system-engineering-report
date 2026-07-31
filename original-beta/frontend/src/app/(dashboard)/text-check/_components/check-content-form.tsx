import { FormField, FormItem } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setTextCheck } from '@/app/_store/slice/text-check';
import { Textarea } from '../../../_components/ui/textarea';
import { TextCheckSchema } from '../_utils/schema';

export default function CheckContentForm() {
  const { onChangeField, control } = useFormReduxContext<TextCheckSchema>({
    setRedux: setTextCheck,
  });
  return (
    <div className="space-y-4">
      <div>
        <FormField
          control={control}
          name="content1"
          render={({ field }) => (
            <FormItem>
              <RequiredLabel>文章に必要な内容</RequiredLabel>
              <Textarea
                {...field}
                id="content1"
                placeholder="文章に必要な内容を入力してください"
                className="min-h-[100px]"
                onChange={(e) => {
                  field.onChange(e);
                  onChangeField({ content1: (e.target as HTMLTextAreaElement).value });
                }}
              />
            </FormItem>
          )}
        />
      </div>
      <div>
        <FormField
          control={control}
          name="content2"
          render={({ field }) => (
            <FormItem>
              <OptionalLabel> </OptionalLabel>
              <Textarea
                {...field}
                id="content2"
                placeholder="文章に必要な内容を入力してください（任意）"
                className="min-h-[100px]"
                onChange={(e) => {
                  field.onChange(e);
                  onChangeField({ content2: (e.target as HTMLTextAreaElement).value });
                }}
              />
            </FormItem>
          )}
        />
      </div>
      <div>
        <FormField
          control={control}
          name="content3"
          render={({ field }) => (
            <FormItem>
              <Textarea
                {...field}
                id="content3"
                placeholder="文章に必要な内容を入力してください（任意）"
                className="min-h-[100px]"
                onChange={(e) => {
                  field.onChange(e);
                  onChangeField({ content3: (e.target as HTMLTextAreaElement).value });
                }}
              />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
