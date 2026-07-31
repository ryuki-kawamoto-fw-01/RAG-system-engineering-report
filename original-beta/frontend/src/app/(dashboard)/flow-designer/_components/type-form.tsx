import { useFormContext } from 'react-hook-form';

import { FormField, FormItem, FormLabel, FormMessage } from '@/app/_components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_components/ui/select';

const processManagementTypes = [
  'FMEA形式工程管理表',
  'QC工程表',
  '作業標準書',
  'チェックシート',
  '工程フロー図',
  'その他',
];

export default function FlowDesignerTypeForm() {
  const { control } = useFormContext();

  return (
    <FormField
      control={control}
      name="type"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium">工程管理表の種類 *</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <SelectTrigger>
              <SelectValue placeholder="工程管理表の種類を選択してください" />
            </SelectTrigger>
            <SelectContent>
              {processManagementTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
