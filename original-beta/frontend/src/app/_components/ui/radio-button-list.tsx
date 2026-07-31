import { cn } from '@/app/_utils/tw-merge';
import { FormControl, FormItem, FormLabel, FormMessage } from './form';
import { RadioGroup, RadioGroupItem } from './radio-group';

type RadioButtonList = {
  value: string;
  options: RadioButton[];
  direction?: 'row' | 'column';
  disabled?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (...event: any[]) => void;
  className?: string;
};

export default function RadioButtonList({
  value,
  options,
  direction = 'row',
  disabled = false,
  onChange,
  className,
}: RadioButtonList) {
  return (
    <FormControl>
      <div>
        <RadioGroup
          onValueChange={onChange}
          defaultValue={value}
          className={cn(
            'flex gap-x-6 gap-y-2 flex-wrap',
            direction === 'row' ? 'flex-row' : 'flex-col',
            className
          )}
        >
          {options.map((option) => (
            <RadioButton
              key={option.value}
              value={option.value}
              label={option.label}
              disabled={disabled}
            />
          ))}
        </RadioGroup>
        <FormMessage className="mt-1.5" />
      </div>
    </FormControl>
  );
}

type RadioButton = {
  value: string;
  label: string;
  disabled?: boolean;
  className?: string;
};
export function RadioButton({ value, label, disabled = false, className }: RadioButton) {
  return (
    <FormItem className={cn('flex items-center gap-x-1.5 space-y-0', className)}>
      <FormControl>
        <RadioGroupItem value={value} disabled={disabled} />
      </FormControl>
      <FormLabel className={cn('text-lg', disabled && 'text-neutral-400')}>{label}</FormLabel>
    </FormItem>
  );
}
