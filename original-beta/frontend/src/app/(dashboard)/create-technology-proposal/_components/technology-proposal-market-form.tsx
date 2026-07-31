import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setCreateTechnologyProposal } from '@/app/_store/slice/create-technology-proposal';
import { Textarea } from '../../../_components/ui/textarea';
import { CreateTechnologyProposalSchema } from '../_utils/schema';

export default function TechnologyProposalRoleForm() {
  const { onChangeField, control } = useFormReduxContext<CreateTechnologyProposalSchema>({
    setRedux: setCreateTechnologyProposal,
  });
  return (
    <div>
      <FormField
        control={control}
        name="market"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>市場</RequiredLabel>
            <Textarea
              {...field}
              id="market"
              placeholder="例：機械製造"
              className="min-h-[150px]"
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
