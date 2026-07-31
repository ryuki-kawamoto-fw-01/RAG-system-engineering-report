import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setCreateTechnologyProposal } from '@/app/_store/slice/create-technology-proposal';
import { Textarea } from '../../../_components/ui/textarea';
import { CreateTechnologyProposalSchema } from '../_utils/schema';

export default function TechnologyProposalCurrentIssuesForm() {
  const { onChangeField, control } = useFormReduxContext<CreateTechnologyProposalSchema>({
    setRedux: setCreateTechnologyProposal,
  });
  return (
    <div>
      <FormField
        control={control}
        name="current_issues"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>現状と課題</RequiredLabel>
            <Textarea
              {...field}
              id="current_issues"
              placeholder="例：生産性の低下"
              className="min-h-[150px]"
              onKeyUp={(e) => {
                onChangeField({ current_issues: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
