import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setDesignDocument } from '@/app/_store/slice/create-design-document';
import { Textarea } from '../../../_components/ui/textarea';
import { DesignDocumentSchema } from '../_utills/schema';

export default function DesignDocumentFeatureArea() {
  const { onChangeField, control } = useFormReduxContext<DesignDocumentSchema>({
    setRedux: setDesignDocument,
  });
  return (
    <div>
      <FormField
        control={control}
        name="feature"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>主な機能・性能要件</RequiredLabel>
            <Textarea
              {...field}
              id="feature"
              placeholder={
                '製品の機能・性能要件を入力してください\n例：作業員の転倒や危険動作をリアルタイムでアラート検知'
              }
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({ feature: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
