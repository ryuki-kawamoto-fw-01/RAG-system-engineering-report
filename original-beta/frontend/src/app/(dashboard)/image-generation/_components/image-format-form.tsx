import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setImageGeneration } from '@/app/_store/slice/image-generation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../_components/ui/select';
import { ImageGenerationSchema } from '../_utils/schema';

export default function ImageFormatForm() {
  const { onChangeField, control } = useFormReduxContext<ImageGenerationSchema>({
    setRedux: setImageGeneration,
  });

  return (
    <div>
      <FormItem>
        <RequiredLabel>画像形式</RequiredLabel>

        <FormField
          control={control}
          name="format"
          render={({ field }) => (
            <FormItem>
              <Select
                {...field}
                onValueChange={(e) => {
                  onChangeField({ format: e });
                }}
              >
                <SelectTrigger id="format" className="w-50">
                  <SelectValue placeholder="画像形式を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </FormItem>
    </div>
  );
}
