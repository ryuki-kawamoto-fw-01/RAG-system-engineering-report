import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setFixImageRequest } from '@/app/_store/slice/image-generation';
import { Textarea } from '../../../_components/ui/textarea';

import { FixImageSchema } from '../_utils/schema';

type Props = {
  className?: string;
};

export default function FixImageRequestForm({ className }: Props) {
  const { control, onChangeField } = useFormReduxContext<FixImageSchema>({
    setRedux: setFixImageRequest,
  });

  return (
    <div className={className}>
      <FormField
        control={control}
        name="fixImageRequest"
        render={({ field }) => (
          <FormItem className="flex h-full flex-col">
            <RequiredLabel>結果を調整する</RequiredLabel>
            <Textarea
              {...field}
              onBlur={(e) => {
                onChangeField(e.target.value);
              }}
              placeholder="例：イラスト風にする"
              className="size-full min-h-[100px] resize-none"
            />
          </FormItem>
        )}
      />
    </div>
  );
}
