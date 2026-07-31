import { FormField, FormItem, FormMessage } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setDesignDocumentReview } from '@/app/_store/slice/design-document-review';
import { Textarea } from '../../../_components/ui/textarea';
import { DesignDocumentReviewSchema } from '../_utils/schema';

export default function PriorityReviewPointForm() {
  const { onChangeField, control } = useFormReduxContext<DesignDocumentReviewSchema>({
    setRedux: setDesignDocumentReview,
  });
  return (
    <FormField
      control={control}
      name="priorityPoint"
      render={({ field }) => (
        <FormItem>
          <OptionalLabel>
            <span>特に見てほしい箇所</span>
          </OptionalLabel>
          <Textarea
            {...field}
            onChange={(e) => {
              field.onChange(e);
              onChangeField({
                priorityPoint: e.target.value,
              });
            }}
            id="priorityPoint"
            className="min-h-[150px]"
            placeholder={`特に見てほしい箇所があれば入力してください（任意）\n例：画面遷移とデータフロー、クラウド側の処理設計、レスポンス形式の統一性`}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
