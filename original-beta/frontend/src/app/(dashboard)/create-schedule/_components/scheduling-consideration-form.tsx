import { FormField, FormItem } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setCreateSchedule } from '@/app/_store/slice/create-schedule';
import { CreateScheduleSchema } from '../_utils/schema';

export default function CreatenewScheduleConsiderationForm() {
  const { onChangeField, control } = useFormReduxContext<CreateScheduleSchema>({
    setRedux: setCreateSchedule,
  });
  return (
    <FormField
      control={control}
      name="newScheduleConsiderations"
      render={({ field }) => (
        <FormItem>
          <OptionalLabel>考慮事項</OptionalLabel>
          <Textarea
            {...field}
            placeholder="例：開発工程のスケジュールを想定してください。"
            onKeyUp={(e) => {
              onChangeField({
                newScheduleConsiderations: (e.target as HTMLTextAreaElement).value,
              });
            }}
            className="h-[150px]"
          />
        </FormItem>
      )}
    />
  );
}
