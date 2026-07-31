import { FormField, FormItem } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setResearchReport } from '@/app/_store/slice/research-report';
import { Textarea } from '../../../_components/ui/textarea';
import { ResearchReportSchema } from '../_utils/schema';

export default function ConsiderationForm() {
  const { onChangeField, control } = useFormReduxContext<ResearchReportSchema>({
    setRedux: setResearchReport,
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
              placeholder="希望する章立てや構成、書式などを指定（例：表紙、要旨、目次を含めるなど）"
              onKeyUp={(e) => {
                onChangeField({ consideration: (e.target as HTMLTextAreaElement).value });
              }}
              className="min-h-[100px]"
            />
          </FormItem>
        )}
      />
    </div>
  );
}
