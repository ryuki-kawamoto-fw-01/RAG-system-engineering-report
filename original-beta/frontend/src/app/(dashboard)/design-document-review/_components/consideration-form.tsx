import { FormField, FormItem, FormMessage } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setDesignDocumentReview } from '@/app/_store/slice/design-document-review';
import { Textarea } from '../../../_components/ui/textarea';
import { DesignDocumentReviewSchema } from '../_utils/schema';

export default function ConsiderationForm() {
  const { onChangeField, control } = useFormReduxContext<DesignDocumentReviewSchema>({
    setRedux: setDesignDocumentReview,
  });
  return (
    <FormField
      control={control}
      name="consideration"
      render={({ field }) => (
        <FormItem>
          <OptionalLabel>
            <span>考慮事項</span>
          </OptionalLabel>
          <Textarea
            {...field}
            onChange={(e) => {
              field.onChange(e);
              onChangeField({
                consideration: e.target.value,
              });
            }}
            id="consideration"
            className="min-h-[150px]"
            placeholder={`その他考慮事項や補足情報があれば入力してください（任意）\n例：対象ユーザー、設計の背景、既知の課題`}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
