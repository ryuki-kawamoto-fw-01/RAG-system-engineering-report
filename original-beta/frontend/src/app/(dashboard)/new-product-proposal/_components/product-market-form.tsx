import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setNewProductProposal } from '@/app/_store/slice/new-product-proposal';
import { Textarea } from '../../../_components/ui/textarea';
import { NewProductProposalSchema } from '../_utils/schema';

export default function ProductMarketForm() {
  const { onChangeField, control } = useFormReduxContext<NewProductProposalSchema>({
    setRedux: setNewProductProposal,
  });
  return (
    <div>
      <FormField
        control={control}
        name="market"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>新製品の市場</RequiredLabel>
            <Textarea
              {...field}
              placeholder={`新製品の市場を入力してください\n例：生活用品`}
              className="min-h-[80px]"
              onKeyUp={(e) => {
                onChangeField({ market: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
