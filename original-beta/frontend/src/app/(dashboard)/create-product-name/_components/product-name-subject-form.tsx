import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setCreateProductName } from '@/app/_store/slice/create-product-name';
import { CreateProductNameSchema } from '../_utils/schema';

export default function ProductNameSubjectForm() {
  const { onChangeField, control } = useFormReduxContext<CreateProductNameSchema>({
    setRedux: setCreateProductName,
  });
  return (
    <div>
      <FormField
        control={control}
        name="subject"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>製品の概要</RequiredLabel>
            <Textarea
              {...field}
              id="subject"
              placeholder={`製品の概要を入力してください\n例：製品の対象、用途など`}
              className="min-h-[150px]"
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
