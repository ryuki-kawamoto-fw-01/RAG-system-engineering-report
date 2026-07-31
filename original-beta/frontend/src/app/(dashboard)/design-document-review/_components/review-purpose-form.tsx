import { FormField, FormItem, FormMessage } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setDesignDocumentReview } from '@/app/_store/slice/design-document-review';
import { Textarea } from '../../../_components/ui/textarea';
import { DesignDocumentReviewSchema } from '../_utils/schema';

export default function ReviewPurposeForm() {
  const { onChangeField, control } = useFormReduxContext<DesignDocumentReviewSchema>({
    setRedux: setDesignDocumentReview,
  });
  return (
    <FormField
      control={control}
      name="reviewPurpose"
      render={({ field }) => (
        <FormItem>
          <OptionalLabel>
            <span>レビューの目的</span>
          </OptionalLabel>
          <Textarea
            {...field}
            onChange={(e) => {
              field.onChange(e);
              onChangeField({
                reviewPurpose: e.target.value,
              });
            }}
            id="reviewPurpose"
            className="min-h-[150px]"
            placeholder={`レビューの目的があれば入力してください（任意）\n例：連携部分の設計に問題がないか確認したい、初期設計段階での抜け漏れがないか確認したい`}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
