import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setResearchReport } from '@/app/_store/slice/research-report';
import { Textarea } from '../../../_components/ui/textarea';
import { ResearchReportSchema } from '../_utils/schema';

export default function RoleForm() {
  const { onChangeField, control } = useFormReduxContext<ResearchReportSchema>({
    setRedux: setResearchReport,
  });
  return (
    <div>
      <FormField
        control={control}
        name="purpose"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>研究目的</RequiredLabel>
            <Textarea
              {...field}
              id="purpose"
              placeholder="研究で明らかにしたいこと（例：生成AIモデルによる要約精度の違いを比較・評価する）"
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({ purpose: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
