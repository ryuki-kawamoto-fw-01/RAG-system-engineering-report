import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setImageGeneration } from '@/app/_store/slice/image-generation';
import { Textarea } from '../../../_components/ui/textarea';
import { ImageGenerationSchema } from '../_utils/schema';

export default function ImageContentForm() {
  const { onChangeField, control } = useFormReduxContext<ImageGenerationSchema>({
    setRedux: setImageGeneration,
  });
  return (
    <div>
      <FormField
        control={control}
        name="content"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>作成したい画像内容</RequiredLabel>
            <Textarea
              {...field}
              id="content"
              placeholder="例：青い空と白い雲"
              className="min-h-[150px]"
              onKeyUp={(e) => {
                onChangeField({ content: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
