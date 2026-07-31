import { FormField, FormItem } from '@/app/_components/ui/form';
import { Label } from '@/app/_components/ui/label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { add } from '@/app/_store/slice/code-explanation';
import { CodeExplanationSchema } from '../_utils/schema';

export default function ProgrammingLanguageInputArea() {
  const { onChangeField, control } = useFormReduxContext<CodeExplanationSchema>({
    setRedux: add,
  });
  return (
    <FormField
      control={control}
      name="programmingLanguage"
      render={({ field }) => (
        <FormItem>
          <Label className="mt-2 flex items-center gap-2">
            プログラミング言語または製品名
            <span className="ml-2 text-sm text-red-500">※必須</span>
          </Label>
          <Textarea
            {...field}
            onBlur={(e) => {
              onChangeField({ programmingLanguage: e.target.value });
            }}
            placeholder="例：Pythonなど"
            className="h-[150px]"
          />
        </FormItem>
      )}
    />
  );
}
