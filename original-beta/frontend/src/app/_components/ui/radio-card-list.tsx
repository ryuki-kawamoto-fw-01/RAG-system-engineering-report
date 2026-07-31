import { cn } from '@/app/_utils/tw-merge';
import { FormControl, FormItem, FormLabel, FormMessage } from './form';
import { RadioGroup, RadioGroupItem } from './radio-group';

type RadioCardList = {
  value: string;
  options: RadioCard[];
  disabled?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (...event: any[]) => void;
  className?: string;
};

export default function RadioCardList({
  value,
  options,
  disabled = false,
  onChange,
  className,
}: RadioCardList) {
  return (
    <FormControl>
      <>
        <RadioGroup onValueChange={onChange} defaultValue={value} className={className}>
          {options.map(({ label, description, ...option }) => (
            <RadioCard
              key={option.value}
              value={option.value}
              label={label}
              description={description}
              checked={option.value === value}
              disabled={disabled}
            />
          ))}
        </RadioGroup>
        <FormMessage />
      </>
    </FormControl>
  );
}

type RadioCard = {
  value: string;
  label: string;
  description: string;
  checked?: boolean;
  disabled?: boolean;
  className?: string;
};
export function RadioCard({
  value,
  label,
  description,
  checked = false,
  disabled = false,
  className,
}: RadioCard) {
  return (
    <div
      className={cn(
        'border border-neutral-200 bg-white rounded-lg',
        checked && 'bg-sky-100 border-sky-650',
        disabled && 'border-neutral-200 bg-neutral-100',
        className
      )}
    >
      <FormItem>
        <FormLabel className="flex cursor-pointer items-start gap-x-2 space-y-0 px-3 py-2.5">
          <FormControl>
            <RadioGroupItem
              value={value}
              disabled={disabled}
              className="data-[state=unchecked]:disabled:bg-white-200"
            />
          </FormControl>
          <div className="cursor-pointer space-y-1.5">
            <div className="text-lg font-bold">{label}</div>
            <div className="text-base font-normal leading-normal">{description}</div>
          </div>
        </FormLabel>
      </FormItem>
    </div>
  );
}
