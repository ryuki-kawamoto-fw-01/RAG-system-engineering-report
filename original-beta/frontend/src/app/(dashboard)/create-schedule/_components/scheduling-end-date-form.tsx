import { FormField, FormItem } from '@/app/_components/ui/form';
import { Input } from '@/app/_components/ui/input';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setCreateSchedule } from '@/app/_store/slice/create-schedule';
import { CreateScheduleSchema } from '../_utils/schema';

export default function SchedulingEndDateForm() {
  const { onChangeField, control, watch } = useFormReduxContext<CreateScheduleSchema>({
    setRedux: setCreateSchedule,
  });

  const startDate = watch('newSchedulestartdate');

  return (
    <FormField
      control={control}
      name="newScheduleenddate"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel>終了日</RequiredLabel>
          <Input
            type="date"
            inputSize="sm"
            min={startDate ? startDate.toISOString().slice(0, 10) : undefined}
            value={field.value ? field.value.toISOString().slice(0, 10) : ''}
            onChange={(e) => {
              const dateValue = e.target.value ? new Date(e.target.value) : undefined;
              onChangeField({
                newScheduleenddate: dateValue,
              });
              field.onChange(dateValue);
            }}
            className="h-[40px]"
          />
        </FormItem>
      )}
    />
  );
}
