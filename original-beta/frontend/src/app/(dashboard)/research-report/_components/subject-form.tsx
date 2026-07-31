import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setResearchReport } from '@/app/_store/slice/research-report';
import { Textarea } from '../../../_components/ui/textarea';
import { ResearchReportSchema } from '../_utils/schema';

export default function SubjectForm() {
  const { onChangeField, control } = useFormReduxContext<ResearchReportSchema>({
    setRedux: setResearchReport,
  });
  return (
    <div>
      <FormField
        control={control}
        name="subject"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>研究テーマ</RequiredLabel>
            <Textarea
              {...field}
              id="subject"
              placeholder="何についての研究か（例：AIによる画像認識、地域別の気候変動影響）"
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({ subject: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
