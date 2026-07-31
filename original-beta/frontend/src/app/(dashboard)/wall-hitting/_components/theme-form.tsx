import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setWallHitting } from '@/app/_store/slice/wall-hitting';
import { Textarea } from '../../../_components/ui/textarea';
import { WallHittingSchema } from '../_utils/schema';

export default function ThemeForm() {
  const { onChangeField, control } = useFormReduxContext<WallHittingSchema>({
    setRedux: setWallHitting,
  });
  return (
    <div>
      <FormField
        control={control}
        name="theme"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>テーマ</RequiredLabel>
            <Textarea
              {...field}
              id="theme"
              placeholder="例：生成AI"
              className="min-h-[150px]"
              onKeyUp={(e) => {
                onChangeField({ theme: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
