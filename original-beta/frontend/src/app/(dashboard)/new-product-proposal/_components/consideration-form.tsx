import { FormField, FormItem } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setNewProductProposal } from '@/app/_store/slice/new-product-proposal';
import { Textarea } from '../../../_components/ui/textarea';
import { NewProductProposalSchema } from '../_utils/schema';

export default function ConsiderationForm() {
  const { onChangeField, control } = useFormReduxContext<NewProductProposalSchema>({
    setRedux: setNewProductProposal,
  });
  return (
    <div>
      <FormField
        control={control}
        name="consideration"
        render={({ field }) => (
          <FormItem>
            <OptionalLabel>考慮事項</OptionalLabel>
            <Textarea
              {...field}
              placeholder={`その他考慮事項があれば入力してください\n例：発売予定時期、売上目標額、投資予定額、箇条書きを使わないなど`}
              className="min-h-[100px]"
              onKeyUp={(e) => {
                onChangeField({ consideration: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
