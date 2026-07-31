import { FormField, FormItem } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setErrorAnalysis } from '@/app/_store/slice/error-analysis';
import { Textarea } from '../../../_components/ui/textarea';
import { CreateErrorAnalysisSchema } from '../_utils/schema';

export default function ErrorAnalysisConsiderationForm() {
  const { onChangeField, control } = useFormReduxContext<CreateErrorAnalysisSchema>({
    setRedux: setErrorAnalysis,
  });

  return (
    <div>
      <FormField
        control={control}
        name="considerations"
        render={({ field }) => (
          <FormItem>
            <OptionalLabel>考慮事項</OptionalLabel>
            <Textarea
              {...field}
              placeholder="例：初心者にも分かりやすく説明してください"
              onKeyUp={(e) => {
                onChangeField({ considerations: (e.target as HTMLTextAreaElement).value });
              }}
              className="min-h-[80px]"
            />
          </FormItem>
        )}
      />
    </div>
  );
}
