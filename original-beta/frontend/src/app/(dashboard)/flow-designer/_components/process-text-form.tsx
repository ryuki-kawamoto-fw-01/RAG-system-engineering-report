import { FormControl, FormField, FormItem, FormMessage } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setText } from '@/app/_store/slice/flow-designer';
import type { FlowDesignerSchema } from '../_utils/schema';

export default function ProcessTextForm() {
  const { control, onChangeField } = useFormReduxContext<FlowDesignerSchema>({
    setRedux: setText,
  });

  return (
    <FormField
      control={control}
      name="text"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel>製造工程の詳細</RequiredLabel>
          <FormControl>
            <Textarea
              placeholder="製造工程の詳細を入力してください（例：自動車部品（ブレーキパッド）の製造工程：1. 材料混合工程：摩擦材とバインダーを混合 2. 成型工程：プレス機械で成型...）"
              className="min-h-[120px]"
              {...field}
              onChange={(e) => {
                field.onChange(e);
                onChangeField(e.target.value);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
