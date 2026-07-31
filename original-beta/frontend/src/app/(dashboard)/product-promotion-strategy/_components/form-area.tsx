import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { FormProvider } from 'react-hook-form';

import { useSelector } from 'react-redux';
import { Form } from '@/app/_components/ui/form';
import { LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import type { RootState } from '@/app/_store/store';
import { productPromotionStrategySchema } from '../_schemas/productPromotionStrategySchema';
import type { ProductPromotionStrategyRequest } from '../_store/types';
import DifferentiationPointForm from './differentiation-point-form';
import ProductDescriptionForm from './product-description-form';
import PromotionToolsForm from './promotion-tools-form';
import SalesChannelsForm from './sales-channels-form';
import SubmitButton from './submit-button';
import TargetMarketForm from './target-market-form';

interface ProductPromotionStrategyFormAreaProps {
  onSubmit: (data: ProductPromotionStrategyRequest) => void;
  switchLayout: (layout: LayoutType) => void;
  className?: string;
}

export default function ProductPromotionStrategyFormArea({
  onSubmit,
  className,
}: ProductPromotionStrategyFormAreaProps) {
  const { productDescription, targetMarket, differentiationPoint, promotionTools, salesChannels } =
    useSelector((state: RootState) => state.productPromotionStrategy);

  const methods = useFormRedux<ProductPromotionStrategyRequest>({
    resolver: zodResolver(productPromotionStrategySchema),
    values: {
      productDescription,
      targetMarket,
      differentiationPoint,
      promotionTools,
      salesChannels,
    },
  });

  // フォームリセットイベントリスナー
  useEffect(() => {
    const handleReset = () => {
      methods.reset({
        productDescription: '',
        targetMarket: '',
        differentiationPoint: '',
        promotionTools: '',
        salesChannels: '',
      });
    };

    window.addEventListener('product-promotion-strategy-form-reset', handleReset);
    return () => {
      window.removeEventListener('product-promotion-strategy-form-reset', handleReset);
    };
  }, [methods]);

  return (
    <FormProvider {...methods}>
      <Form {...methods}>
        <form
          onSubmit={methods.handleSubmit(onSubmit)}
          className={`relative flex h-full flex-col ${className || ''}`}
        >
          <div className="h-full space-y-6 overflow-y-auto p-4 pb-[48px]">
            <ProductDescriptionForm />
            <TargetMarketForm />
            <DifferentiationPointForm />
            <PromotionToolsForm />
            <SalesChannelsForm />
          </div>
          <SubmitButton />
        </form>
      </Form>
    </FormProvider>
  );
}
