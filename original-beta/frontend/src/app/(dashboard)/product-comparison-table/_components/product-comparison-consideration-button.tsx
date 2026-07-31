import { useFormContext } from 'react-hook-form';

import { Spinner } from '@/app/_components/icon/decorative';
import { Button } from '@/app/_components/ui/button';
import { useAppSelector } from '@/app/_store/hooks';
import { selectProductComparison } from '@/app/_store/selectors/product-comparison';
import { ProductComparisonSchema } from '../_utills/schema';

export function ProductComparisonSubmitButton() {
  const {
    formState: { isValid, isSubmitting, errors },
    watch,
  } = useFormContext<ProductComparisonSchema>();

  const { ProductComparisonResult } = useAppSelector(selectProductComparison);

  // フォームの値を監視
  const formValues = watch();

  // 必須項目が入力されているか独自に確認
  const isProductsValid =
    formValues.products &&
    formValues.products.length > 0 &&
    formValues.products.some((p) => !!p?.trim());
  const isPurposeValid = !!formValues.purpose?.trim();

  // すべての必須項目が有効かどうか
  const isAllRequiredValid = isProductsValid && isPurposeValid;

  // デバッグ用
  console.log('Form validation errors:', errors);
  console.log('Form is valid:', isValid);
  console.log('Required fields:', {
    products: isProductsValid,
    purpose: isPurposeValid,
    allValid: isAllRequiredValid,
  });

  return (
    <Button
      type="submit"
      variant="secondary"
      disabled={!isAllRequiredValid || isSubmitting}
      className="absolute bottom-0 left-1/2 w-full max-w-[180px] -translate-x-1/2"
    >
      {isSubmitting ? (
        <>
          <Spinner className="mr-2 size-6 animate-spin" />
          <span>送信中</span>
        </>
      ) : ProductComparisonResult ? (
        <span>再生成する</span>
      ) : (
        <span>比較する</span>
      )}
    </Button>
  );
}
