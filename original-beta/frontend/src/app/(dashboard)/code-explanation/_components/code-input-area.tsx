import { FormField, FormItem } from '@/app/_components/ui/form';
import { Label } from '@/app/_components/ui/label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { add } from '@/app/_store/slice/code-explanation';
import { CodeExplanationSchema } from '../_utils/schema';

export default function CodeInputInputArea() {
  const { onChangeField, control } = useFormReduxContext<CodeExplanationSchema>({
    setRedux: add,
  });
  return (
    <FormField
      control={control}
      name="code"
      render={({ field }) => (
        <FormItem>
          <Label className="mt-2 flex items-center gap-2">
            コード
            <span className="ml-2 text-sm text-red-500">※必須</span>
          </Label>
          <Textarea
            {...field}
            onBlur={(e) => {
              onChangeField({ code: e.target.value });
            }}
            placeholder="解説してほしいコードを入力"
            className="min-h-[300px]"
          />
        </FormItem>
      )}
    />
  );
}
