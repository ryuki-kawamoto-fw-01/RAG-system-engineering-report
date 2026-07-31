import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setNewProductProposal } from '@/app/_store/slice/new-product-proposal';
import { Textarea } from '../../../_components/ui/textarea';
import { NewProductProposalSchema } from '../_utils/schema';

export default function ProductNameForm() {
  const { onChangeField, control } = useFormReduxContext<NewProductProposalSchema>({
    setRedux: setNewProductProposal,
  });
  return (
    <div>
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>製品名</RequiredLabel>
            <Textarea
              {...field}
              placeholder="製品名を入力してください"
              className="min-h-[80px]"
              onKeyUp={(e) => {
                onChangeField({ name: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
