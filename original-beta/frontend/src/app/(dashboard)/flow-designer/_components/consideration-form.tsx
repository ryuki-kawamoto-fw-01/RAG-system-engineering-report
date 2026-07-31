import { useFormContext } from 'react-hook-form';

import { FormField, FormItem, FormLabel } from '@/app/_components/ui/form';
import { Textarea } from '@/app/_components/ui/textarea';

export default function FlowDesignerConsiderationForm() {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name="consideration"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium">考慮事項（任意）</FormLabel>
          <Textarea
            {...field}
            placeholder="品質基準や特別な要求事項があれば入力してください&#10;例：品質基準ISO/TS16949に準拠し、トレーサビリティを確保"
            className="min-h-[80px]"
          />
        </FormItem>
      )}
    />
  );
}
