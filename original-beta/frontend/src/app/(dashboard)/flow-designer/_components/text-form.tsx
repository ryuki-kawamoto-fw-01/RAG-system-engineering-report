import { useFormContext } from 'react-hook-form';

import { FormField, FormItem, FormLabel, FormMessage } from '@/app/_components/ui/form';
import { Textarea } from '@/app/_components/ui/textarea';

export default function FlowDesignerTextForm() {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name="text"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium">製造工程の詳細 *</FormLabel>
          <Textarea
            {...field}
            placeholder="製造工程の詳細を入力してください&#10;例：&#10;自動車部品（ブレーキパッド）の製造工程：&#10;1. 材料混合工程：摩擦材とバインダーを混合&#10;2. 成型工程：プレス機械で成型&#10;3. 熱処理工程：400度で2時間加熱"
            className="min-h-[120px]"
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
