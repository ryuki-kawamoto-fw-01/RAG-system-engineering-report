import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setTechnologyTraining } from '@/app/_store/slice/technology-training';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../_components/ui/select';
import { TechnologyTrainingSchema } from '../_utils/schema';

export default function LearningLevelForm() {
  const { onChangeField, control } = useFormReduxContext<TechnologyTrainingSchema>({
    setRedux: setTechnologyTraining,
  });

  return (
    <div>
      <FormItem>
        <RequiredLabel>学習レベル</RequiredLabel>

        <FormField
          control={control}
          name="level"
          render={({ field }) => (
            <FormItem>
              <Select
                {...field}
                onValueChange={(e) => {
                  onChangeField({ level: e });
                }}
              >
                <SelectTrigger id="level" className="w-40">
                  <SelectValue placeholder="学習レベルを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="初級">初級</SelectItem>
                  <SelectItem value="中級">中級</SelectItem>
                  <SelectItem value="上級">上級</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </FormItem>
    </div>
  );
}
