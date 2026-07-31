import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setCreateProductName } from '@/app/_store/slice/create-product-name';
import { CreateProductNameSchema } from '../_utils/schema';

export default function ProductNameRoleForm() {
  const { onChangeField, control } = useFormReduxContext<CreateProductNameSchema>({
    setRedux: setCreateProductName,
  });
  return (
    <div>
      <FormField
        control={control}
        name="role"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>製品の特長やポイント</RequiredLabel>
            <Textarea
              {...field}
              id="subject"
              placeholder={`製品のポイントとなる特徴を入力してください\n例：柔軟なカスタマイズが可能`}
              className="min-h-[150px]"
              onKeyUp={(e) => {
                onChangeField({ role: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
