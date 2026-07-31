import { FormField, FormItem } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setTextCorrection } from '@/app/_store/slice/text-correction';
import { Textarea } from '../../../_components/ui/textarea';
import { TextCorrectionSchema } from '../_utils/schema';

export default function AdditionalConsiderationsArea(): JSX.Element {
  const { onChangeField, control } = useFormReduxContext<TextCorrectionSchema>({
    setRedux: setTextCorrection,
  });

  return (
    <FormField
      control={control}
      name="additionalConsiderations"
      render={({ field }) => (
        <FormItem>
          <OptionalLabel>校正の考慮事項</OptionalLabel>
          <Textarea
            {...field}
            onBlur={(e) => {
              onChangeField({ additionalConsiderations: e.target.value });
            }}
            placeholder={`追加の考慮事項を入力してください（任意）\n例：初回の顧客にとって、相応しい文言かどうか確認してください。`}
            className="min-h-[150px]"
          />
        </FormItem>
      )}
    />
  );
}
