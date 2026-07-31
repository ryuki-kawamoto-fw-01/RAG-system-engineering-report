import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setNewProductProposal } from '@/app/_store/slice/new-product-proposal';
import { Textarea } from '../../../_components/ui/textarea';
import { NewProductProposalSchema } from '../_utils/schema';

export default function ConceptForm() {
  const { onChangeField, control } = useFormReduxContext<NewProductProposalSchema>({
    setRedux: setNewProductProposal,
  });
  return (
    <div>
      <FormField
        control={control}
        name="concept"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>新製品のコンセプト</RequiredLabel>
            <Textarea
              {...field}
              placeholder={`新製品のコンセプトを入力してください\n例：飲むだけで環境貢献できるマイボトル`}
              className="min-h-[80px]"
              onKeyUp={(e) => {
                onChangeField({ concept: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
