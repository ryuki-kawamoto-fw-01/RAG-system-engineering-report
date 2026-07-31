import { FormField, FormItem } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setCreateTechnologyProposal } from '@/app/_store/slice/create-technology-proposal';
import { Textarea } from '../../../_components/ui/textarea';
import { CreateTechnologyProposalSchema } from '../_utils/schema';

export default function TechnologyProposalConsiderationForm() {
  const { onChangeField, control } = useFormReduxContext<CreateTechnologyProposalSchema>({
    setRedux: setCreateTechnologyProposal,
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
              placeholder="例：導入スケジュールは〇ヶ月に収まるようにしてほしい"
              onKeyUp={(e) => {
                onChangeField({ consideration: (e.target as HTMLTextAreaElement).value });
              }}
              className="min-h-[150px]"
            />
          </FormItem>
        )}
      />
    </div>
  );
}
