import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Slider } from '@/app/_components/ui/slider';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setCreateIdea } from '@/app/_store/slice/create-idea';
import { CreateIdeaSchema, MAX_COUNT } from '../_utils/schema';

export default function IdeationCountForm() {
  const { onChangeField, control } = useFormReduxContext<CreateIdeaSchema>({
    setRedux: setCreateIdea,
  });

  return (
    <div>
      <FormField
        control={control}
        name="count"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>アイデアの件数</RequiredLabel>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm">件数</p>
                <p className="text-xs text-neutral-500">{field.value!} 件</p>
              </div>
              <Slider
                min={1}
                max={MAX_COUNT}
                step={1}
                value={[field.value!]}
                onValueChange={(e) => {
                  onChangeField({ count: e[0] });
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
