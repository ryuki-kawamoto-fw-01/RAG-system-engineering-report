import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setCreateProductName } from '@/app/_store/slice/create-product-name';
import { CreateProductNameSchema } from '../_utils/schema';

export default function ProductNameConventionForm() {
  const { onChangeField, control } = useFormReduxContext<CreateProductNameSchema>({
    setRedux: setCreateProductName,
  });
  return (
    <div>
      <FormField
        control={control}
        name="convention"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>命名規則</RequiredLabel>
            <Textarea
              {...field}
              placeholder={`ネーミング案の命名規則を入力してください\n例：キャッチフレーズを作成する`}
              onKeyUp={(e) => {
                onChangeField({ convention: (e.target as HTMLTextAreaElement).value });
              }}
              className="min-h-[150px]"
            />
          </FormItem>
        )}
      />
    </div>
  );
}
