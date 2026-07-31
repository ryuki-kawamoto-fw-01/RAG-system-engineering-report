import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setResearchReport } from '@/app/_store/slice/research-report';
import { Textarea } from '../../../_components/ui/textarea';
import { ResearchReportSchema } from '../_utils/schema';

export default function MethodForm() {
  const { onChangeField, control } = useFormReduxContext<ResearchReportSchema>({
    setRedux: setResearchReport,
  });
  return (
    <div>
      <FormField
        control={control}
        name="method"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>研究方法</RequiredLabel>
            <Textarea
              {...field}
              id="method"
              placeholder="実験・調査の手順や、分析手法（例：3種類の分類モデルを用いてテキスト分類を実施）"
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({ method: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
