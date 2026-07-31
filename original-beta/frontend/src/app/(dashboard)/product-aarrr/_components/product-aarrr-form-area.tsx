'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { LAYOUT_RIGHT_ONLY, LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { Form } from '../../../_components/ui/form';
import { useAppDispatch, useAppSelector } from '../../../_store/hooks';
import { setResult, setId } from '../../../_store/slice/product-aarrr';
import { createProductAARRR } from '../_actions/createProductAARRR';
import { ProductAARRRSchema, productAARRRSchema } from '../_utils/schema';
import ProductAARRRButton from './product-aarrr-button';
import ProductAARRRConsiderationsForm from './product-aarrr-considerations-form';
import ProductAARRRContentForm from './product-aarrr-content-form';
import ProductAARRRServiceForm from './product-aarrr-service-form';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function ProductAARRRFormArea({ switchLayout, className }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result, ...defaultValues } = useAppSelector((state) => state.productAARRR);
  const dispatch = useAppDispatch();
  const form = useFormRedux<ProductAARRRSchema>({
    resolver: zodResolver(productAARRRSchema),
    values: defaultValues,
  });

  const handleCreateProductAARRR = async (e: ProductAARRRSchema) => {
    try {
      const id = uniqueId();
      const response = await createProductAARRR(
        id,
        e.product_service,
        e.product_service_content,
        e.additionalConsiderations
      );
      if ('error' in response) {
        toast.error(response.error);
      } else {
        dispatch(setResult({ result: response.answer, feedbackAt: undefined }));
        dispatch(setId(id));
        toast.success(getMessage('I_F_00030', '作成結果'));
        switchLayout(LAYOUT_RIGHT_ONLY);

        return response;
      }
    } catch {
      toast.error(getMessage('E_F_00110', '作成結果'));
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleCreateProductAARRR)}
        className={cn('relative flex h-full flex-col', className)}
      >
        <div className="flex-1 space-y-3 overflow-y-auto pb-[48px]">
          <ProductAARRRServiceForm />
          <ProductAARRRContentForm />
          <ProductAARRRConsiderationsForm />
          <ProductAARRRButton />
        </div>
      </form>
    </Form>
  );
}
