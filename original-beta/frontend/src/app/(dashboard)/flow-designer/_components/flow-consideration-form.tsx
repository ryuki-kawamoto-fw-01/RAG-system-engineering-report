import { FormControl, FormField, FormItem, FormMessage } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setConsideration } from '@/app/_store/slice/flow-designer';
import type { FlowDesignerSchema } from '../_utils/schema';

export default function FlowConsiderationForm() {
  const { control, onChangeField } = useFormReduxContext<FlowDesignerSchema>({
    setRedux: setConsideration,
  });

  return (
    <FormField
      control={control}
      name="consideration"
      render={({ field }) => (
        <FormItem>
          <OptionalLabel>考慮事項</OptionalLabel>
          <FormControl>
            <Textarea
              placeholder="特別な考慮事項があれば入力してください（例：品質基準ISO/TS16949に準拠し、トレーサビリティを確保）"
              className="min-h-[80px]"
              {...field}
              onChange={(e) => {
                field.onChange(e);
                onChangeField(e.target.value);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
