import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setProductServiceBenefitIdea } from '@/app/_store/slice/product-service-benefit-idea';
import { Textarea } from '../../../_components/ui/textarea';
import { CreateIdeaSchema } from '../_utils/schema';

export default function ProductForm() {
  const { onChangeField, control } = useFormReduxContext<CreateIdeaSchema>({
    setRedux: setProductServiceBenefitIdea,
  });
  return (
    <div>
      <FormField
        control={control}
        name="product"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>製品</RequiredLabel>
            <Textarea
              {...field}
              id="product"
              placeholder="例：工場設備の予防保全を支援するIoTシステム"
              className="min-h-[150px]"
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
