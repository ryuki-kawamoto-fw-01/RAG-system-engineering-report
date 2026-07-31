import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setProductServiceBenefitIdea } from '@/app/_store/slice/product-service-benefit-idea';
import { Textarea } from '../../../_components/ui/textarea';
import { CreateIdeaSchema } from '../_utils/schema';

export default function FeaturesForm() {
  const { onChangeField, control } = useFormReduxContext<CreateIdeaSchema>({
    setRedux: setProductServiceBenefitIdea,
  });
  return (
    <div>
      <FormField
        control={control}
        name="features"
        render={({ field }) => (
          <FormItem>
            <RequiredLabel>製品の特長</RequiredLabel>
            <Textarea
              {...field}
              id="features"
              placeholder="例：センサーによる稼働状況・異常検知のリアルタイム監視"
              className="min-h-[150px]"
              onKeyUp={(e) => {
                onChangeField({ features: (e.target as HTMLTextAreaElement).value });
              }}
            />
          </FormItem>
        )}
      />
    </div>
  );
}
