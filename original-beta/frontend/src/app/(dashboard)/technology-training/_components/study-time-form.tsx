import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Slider } from '@/app/_components/ui/slider';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setTechnologyTraining } from '@/app/_store/slice/technology-training';
import { TechnologyTrainingSchema, MAX_COUNT } from '../_utils/schema';

export default function StudyTimeForm() {
  const { onChangeField, control } = useFormReduxContext<TechnologyTrainingSchema>({
    setRedux: setTechnologyTraining,
  });

  return (
    <div>
      <FormField
        control={control}
        name="time"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>学習時間</RequiredLabel>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm">時間</p>
                <p className="text-xs text-neutral-500">{field.value} ｈ</p>
              </div>
              <Slider
                min={1}
                max={MAX_COUNT}
                step={1}
                value={[field.value ?? 0]}
                onValueChange={(e) => {
                  onChangeField({ time: e[0] });
                }}
                className="w-full"
              />
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}
