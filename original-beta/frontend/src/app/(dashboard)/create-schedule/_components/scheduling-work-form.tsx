import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setCreateSchedule } from '@/app/_store/slice/create-schedule';
import { CreateScheduleSchema } from '../_utils/schema';

export default function SchedulingWorkForm() {
  const { onChangeField, control } = useFormReduxContext<CreateScheduleSchema>({
    setRedux: setCreateSchedule,
  });
  return (
    <FormField
      control={control}
      name="newSchedulework"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel>主題</RequiredLabel>
          <Textarea
            {...field}
            id="newSchedulework"
            placeholder="例：2週間以内に見積を提示したい。必要な事項とかかる時間を考えて考慮してください。"
            className="h-[150px]"
            onKeyUp={(e) => {
              onChangeField({ newSchedulework: (e.target as HTMLTextAreaElement).value });
            }}
          />
        </FormItem>
      )}
    />
  );
}
