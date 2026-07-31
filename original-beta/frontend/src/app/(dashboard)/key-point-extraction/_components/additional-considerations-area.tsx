import { FormField, FormItem } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setKeyPointExtraction } from '@/app/_store/slice/key-point-extraction';
import { Textarea } from '../../../_components/ui/textarea';
import { KeyPointExtractionSchema } from '../_utils/schema';

export default function AdditionalConsiderationsArea(): JSX.Element {
  const { onChangeField, control } = useFormReduxContext<KeyPointExtractionSchema>({
    setRedux: setKeyPointExtraction,
  });

  return (
    <FormField
      control={control}
      name="additionalConsiderations"
      render={({ field }) => (
        <FormItem>
          <OptionalLabel>考慮事項</OptionalLabel>
          <Textarea
            {...field}
            onBlur={(e) => {
              onChangeField({ additionalConsiderations: e.target.value });
            }}
            placeholder={`追加の考慮事項を入力してください（任意）\n例：抽出する情報は、報告書や会議資料に使えるようにわかりやすく整理する`}
            className="min-h-[150px]"
          />
        </FormItem>
      )}
    />
  );
}
