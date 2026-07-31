import { FormControl, FormField, FormItem, FormMessage } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_components/ui/select';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setType } from '@/app/_store/slice/flow-designer';
import type { FlowDesignerSchema } from '../_utils/schema';

const FLOW_TYPES = [
  { value: 'FMEA形式工程管理表', label: 'FMEA形式工程管理表' },
  { value: '標準工程管理表', label: '標準工程管理表' },
  { value: 'QC工程表', label: 'QC工程表' },
  { value: '作業指示書形式', label: '作業指示書形式' },
  { value: 'フローチャート形式', label: 'フローチャート形式' },
] as const;

export default function FlowTypeForm() {
  const { control, onChangeField } = useFormReduxContext<FlowDesignerSchema>({
    setRedux: setType,
  });

  return (
    <FormField
      control={control}
      name="type"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel>工程管理表の種類</RequiredLabel>
          <Select
            onValueChange={(v) => {
              field.onChange(v);
              onChangeField(v);
            }}
            defaultValue={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectGroup>
                {FLOW_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
