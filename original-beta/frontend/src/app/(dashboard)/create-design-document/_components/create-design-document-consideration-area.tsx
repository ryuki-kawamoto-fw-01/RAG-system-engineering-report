import { FormField, FormItem } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setDesignDocument } from '@/app/_store/slice/create-design-document';
import { Textarea } from '../../../_components/ui/textarea';
import { DesignDocumentSchema } from '../_utills/schema';

export default function DesignDocumentConsiderationArea() {
  const { onChangeField, control } = useFormReduxContext<DesignDocumentSchema>({
    setRedux: setDesignDocument,
  });
  return (
    <div>
      <FormField
        control={control}
        name="additionalConsiderations"
        render={({ field }) => (
          <FormItem>
            <OptionalLabel>考慮事項</OptionalLabel>
            <Textarea
              {...field}
              placeholder="例：プライバシー保護のため、録画データの暗号化が必要"
              onKeyUp={(e) => {
                onChangeField({
                  additionalConsiderations: (e.target as HTMLTextAreaElement).value,
                });
              }}
              className="min-h-[100px]"
            />
          </FormItem>
        )}
      />
    </div>
  );
}
