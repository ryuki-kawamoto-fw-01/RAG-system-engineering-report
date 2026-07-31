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

export default function ImageSizeForm() {
  const { onChangeField, control } = useFormReduxContext<ImageGenerationSchema>({
    setRedux: setImageGeneration,
  });
  return (
    <div>
      <FormItem>
        <RequiredLabel>画像サイズ</RequiredLabel>

        <FormField
          control={control}
          name="size"
          render={({ field }) => (
            <FormItem>
              <Select
                {...field}
                onValueChange={(e) => {
                  onChangeField({ size: e });
                }}
              >
                <SelectTrigger id="document-type" className="w-50">
                  <SelectValue placeholder="画像サイズを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1024x1024">1024×1024（標準）</SelectItem>
                  <SelectItem value="1024x1536">1024×1536（縦長）</SelectItem>
                  <SelectItem value="1536x1024">1536×1024（横長）</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </FormItem>
    </div>
  );
}
