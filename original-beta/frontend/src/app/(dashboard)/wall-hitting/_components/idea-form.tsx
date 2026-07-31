import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setWallHitting } from '@/app/_store/slice/wall-hitting';
import { Textarea } from '../../../_components/ui/textarea';
import { WallHittingSchema } from '../_utils/schema';

export default function IdeaForm() {
  const { onChangeField, control } = useFormReduxContext<WallHittingSchema>({
    setRedux: setWallHitting,
  });
  return (
    <div>
      <FormField
        control={control}
        name="idea"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>アイデア</RequiredLabel>
            <Textarea
              {...field}
              id="idea"
              placeholder="例：業務を効率化するアプリケーション"
              className="min-h-[150px]"
              onKeyUp={(e) => {
                onChangeField({ idea: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
