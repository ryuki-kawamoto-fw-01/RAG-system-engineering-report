import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setDesignDocument } from '@/app/_store/slice/create-design-document';
import { Textarea } from '../../../_components/ui/textarea';
import { DesignDocumentSchema } from '../_utills/schema';

export default function DesignDocumentProductArea() {
  const { onChangeField, control } = useFormReduxContext<DesignDocumentSchema>({
    setRedux: setDesignDocument,
  });
  return (
    <div>
      <FormField
        control={control}
        name="product"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>製品名</RequiredLabel>
            <Textarea
              {...field}
              id="product"
              placeholder={'製品名を入力してください\n例：工場用AI異常検知カメラ'}
              className="min-h-[50px]"
              onKeyUp={(e) => {
                onChangeField({ product: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
