'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import LayoutSwitchButton from '@/app/_components/common-usecase/layout-switch-button';
import PageLayout from '@/app/_components/layout/page-layout';
import { Form } from '@/app/_components/ui/form';
import { LAYOUT_RIGHT_ONLY } from '@/app/_constants/common-usecase';
import { useUseCaseLayout } from '@/app/_hooks/use-usecase-layout';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setResult, setId } from '@/app/_store/slice/production-tech-list';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { createProductionTechList } from './_actions/createProductionTechList';
import CreateProductionTechListForm from './_components/create-production-tech-list-form';
import ProductionTechListResult from './_components/production-tech-list-result';
import ProductionTechListTitle from './_components/production-tech-list-title';
import { ProductionTechListSchema, productionTechListSchema } from './_utils/schema';

function ProductionTechListPage() {
  const dispatch = useAppDispatch();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { answer, ProductionTechListLength, ...restDefaultValues } = useAppSelector(
    (state) => state.productionTechList
  );
  const defaultValues: ProductionTechListSchema = {
    ...restDefaultValues,
    productionTechListSchemaLength: ProductionTechListLength ?? 1, // fallback to 1 if undefined
    issues: restDefaultValues.issues ?? '', // ensure issues is always a string
  };
  const form = useFormRedux<ProductionTechListSchema>({
    resolver: zodResolver(productionTechListSchema),
    values: defaultValues,
  });
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(answer);

  const handleSubmit = async (e: ProductionTechListSchema) => {
    try {
      const formData = new FormData();
      formData.append(
        'productionTechListSchemaLength',
        e.productionTechListSchemaLength.toString()
      );
      formData.append('category', e.category);
      formData.append('focus', e.focus);
      formData.append('issues', e.issues ?? '');
      formData.append('activeTab', e.activeTab);
      const id = uniqueId();
      const props = {
        id,
        category: e.category,
        focus: e.focus,
        issues: e.issues,
      };
      const response = await createProductionTechList(props);
      if ('answer' in response) {
        dispatch(setResult({ answer: response.answer ?? '', feedbackAt: undefined }));
        dispatch(setId(id));
        toast.success(getMessage('I_F_00030', '洗い出し結果'));
        switchLayout(LAYOUT_RIGHT_ONLY);
      } else {
        toast.error(response.error ?? 'エラーが発生しました');
      }
    } catch (error) {
      console.error('Error creating minutes:', error);
      toast.error(getMessage('E_F_00110', '洗い出し結果'));
    }
  };

  return (
    <PageLayout className="flex flex-col">
      <ProductionTechListTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />

      <Form {...form}>
        <form
          className="flex flex-1 gap-x-10 overflow-hidden"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          {(isLeftOnly || isTwoColumns) && (
            <CreateProductionTechListForm
              className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px]')}
            />
          )}
          {(isRightOnly || isTwoColumns) && (
            <ProductionTechListResult className={cn('w-full', isTwoColumns && 'w-2/3')} />
          )}
        </form>
      </Form>
    </PageLayout>
  );
}

export default ProductionTechListPage;
