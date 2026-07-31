import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setResearchReport } from '@/app/_store/slice/research-report';
import { Textarea } from '../../../_components/ui/textarea';
import { ResearchReportSchema } from '../_utils/schema';

export default function ReferenceForm() {
  const { onChangeField, control } = useFormReduxContext<ResearchReportSchema>({
    setRedux: setResearchReport,
  });
  return (
    <div>
      <FormField
        control={control}
        name="references"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>参考文献</RequiredLabel>
            <Textarea
              {...field}
              id="references"
              placeholder="使用した文献のリストと引用形式"
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({ references: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
