import { FormField, FormItem } from '@/app/_components/ui/form';
import RequiredLabel from '@/app/_components/ui/required-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { useFormReduxContext } from '@/app/_hooks/use_form';
import { setProductAARRR } from '@/app/_store/slice/product-aarrr';
import { ProductAARRRSchema } from '../_utils/schema';

export default function ProductAARRRContentForm() {
  const { onChangeField, control } = useFormReduxContext<ProductAARRRSchema>({
    setRedux: setProductAARRR,
  });

  return (
    <FormField
      control={control}
      name="product_service_content"
      render={({ field }) => (
        <FormItem>
          <RequiredLabel>商品・サービスの内容</RequiredLabel>
          <Textarea
            {...field}
            placeholder="例：AIが自動でレシート読み取りと家計分析を行い、節約アドバイスを提供するフリーミアムモデルの家計簿アプリ。プレミアム版では詳細な分析レポートと投資アドバイス機能を提供。"
            className="min-h-[150px]"
            onBlur={(e) => {
              onChangeField({ product_service_content: e.target.value });
            }}
          />
        </FormItem>
      )}
    />
  );
}
