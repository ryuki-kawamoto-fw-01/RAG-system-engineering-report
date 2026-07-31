import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setCreateTechnologyProposal } from '@/app/_store/slice/create-technology-proposal';
import { Textarea } from '../../../_components/ui/textarea';
import { CreateTechnologyProposalSchema } from '../_utils/schema';

export default function TechnologyNameForm() {
  const { onChangeField, control } = useFormReduxContext<CreateTechnologyProposalSchema>({
    setRedux: setCreateTechnologyProposal,
  });
  return (
    <div>
      <FormField
        control={control}
        name="technologyName"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>新技術名</RequiredLabel>
            <Textarea
              {...field}
              id="technologyName"
              placeholder="例：デジタルツイン"
              className="min-h-[150px]"
              onKeyUp={(e) => {
                onChangeField({ technologyName: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
