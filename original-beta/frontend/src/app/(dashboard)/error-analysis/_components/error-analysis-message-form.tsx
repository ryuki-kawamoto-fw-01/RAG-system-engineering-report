import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setErrorAnalysis } from '@/app/_store/slice/error-analysis';
import { Textarea } from '../../../_components/ui/textarea';
import { CreateErrorAnalysisSchema } from '../_utils/schema';

export default function ErrorAnalysisMessageForm() {
  const { onChangeField, control } = useFormReduxContext<CreateErrorAnalysisSchema>({
    setRedux: setErrorAnalysis,
  });

  return (
    <div>
      <FormField
        control={control}
        name="errorMessage"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>エラーメッセージ</RequiredLabel>
            <Textarea
              {...field}
              placeholder="エラーメッセージを入力"
              onKeyUp={(e) => {
                onChangeField({ errorMessage: (e.target as HTMLTextAreaElement).value });
              }}
              className="min-h-[120px]"
            />
          </FormItem>
        )}
      />
    </div>
  );
}
