import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormControl, FormField, FormItem } from '@/app/_components/ui/form';
import OptionalLabel from '@/app/_components/ui/optional-label';
import { Textarea } from '@/app/_components/ui/textarea';
import { ProductComparisonSchema } from '../_utills/schema';

export default function ProductComparisonConsiderationForm() {
  const { control, setValue } = useFormContext<ProductComparisonSchema>();

  // リセットイベントのリスナーを追加
  useEffect(() => {
    const handleReset = () => {
      // 考慮事項フィールドを明示的にリセット
      setValue('additionalConsiderations', '', { shouldDirty: false });
    };

    // イベントリスナーを登録
    window.addEventListener('product-comparison-form-reset', handleReset);

    // クリーンアップ
    return () => {
      window.removeEventListener('product-comparison-form-reset', handleReset);
    };
  }, [setValue]);

  return (
    <FormField
      control={control}
      name="additionalConsiderations"
      render={({ field }) => (
        <FormItem>
          <OptionalLabel>考慮事項</OptionalLabel>
          <FormControl>
            <Textarea {...field} placeholder="例：海外製品は除外する" className="h-[100px]" />
          </FormControl>
        </FormItem>
      )}
    />
  );
}
