import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setNewProductProposal } from '@/app/_store/slice/new-product-proposal';
import { Textarea } from '../../../_components/ui/textarea';
import { NewProductProposalSchema } from '../_utils/schema';

export default function ComparisonPointsForm() {
  const { onChangeField, control } = useFormReduxContext<NewProductProposalSchema>({
    setRedux: setNewProductProposal,
  });
  return (
    <div>
      <FormField
        control={control}
        name="comparisonPoints"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>他社製品と比較したポイント</RequiredLabel>
            <Textarea
              {...field}
              placeholder={`新製品の独自性を主張するポイントを入力してください\n例：他社製品よりも軽量で持ち運びやすい`}
              className="min-h-[80px]"
              onKeyUp={(e) => {
                onChangeField({ comparisonPoints: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
