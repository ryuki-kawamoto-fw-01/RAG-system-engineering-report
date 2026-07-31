import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setNewProductProposal } from '@/app/_store/slice/new-product-proposal';
import { Textarea } from '../../../_components/ui/textarea';
import { NewProductProposalSchema } from '../_utils/schema';

export default function TargetCustomerForm() {
  const { onChangeField, control } = useFormReduxContext<NewProductProposalSchema>({
    setRedux: setNewProductProposal,
  });
  return (
    <div>
      <FormField
        control={control}
        name="target"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>ターゲット顧客</RequiredLabel>
            <Textarea
              {...field}
              placeholder={`ターゲット顧客を入力してください\n例：環境意識の高い20〜40代の都市部在住者`}
              className="min-h-[80px]"
              onKeyUp={(e) => {
                onChangeField({ target: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
