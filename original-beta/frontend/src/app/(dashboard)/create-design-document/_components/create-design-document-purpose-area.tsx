import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setDesignDocument } from '@/app/_store/slice/create-design-document';
import { Textarea } from '../../../_components/ui/textarea';
import { DesignDocumentSchema } from '../_utills/schema';

export default function DesignDocumentPurposeArea() {
  const { onChangeField, control } = useFormReduxContext<DesignDocumentSchema>({
    setRedux: setDesignDocument,
  });
  return (
    <div>
      <FormField
        control={control}
        name="purpose"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>製品の目的・用途</RequiredLabel>
            <Textarea
              {...field}
              id="purpose"
              placeholder={
                '製品の目的・用途を入力してください\n例：工場ラインで作業員の安全確認や異常動作を検知する'
              }
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
