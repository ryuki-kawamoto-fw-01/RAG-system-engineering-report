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
import { setResult, setId } from '@/app/_store/slice/business-plan';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { createBusinessPlan } from './_actions/createBusinessPlan';
import BusinessPlanResult from './_components/business-plan-result';
import BusinessPlanTitle from './_components/business-plan-title';
import CreateBusinessPlanForm from './_components/create-business-plan-form';
import { BusinessPlanSchema, businessPlanSchema } from './_utils/schema';

function BusinessPlanPage() {
  const dispatch = useAppDispatch();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { answer, businessPlanLength, ...restDefaultValues } = useAppSelector(
    (state) => state.businessPlan
  );
  const defaultValues: BusinessPlanSchema = {
    ...restDefaultValues,
    businessPlanSchemaLength: businessPlanLength ?? 1, // fallback to 1 if undefined
  };
  const form = useFormRedux<BusinessPlanSchema>({
    resolver: zodResolver(businessPlanSchema),
    values: defaultValues,
  });
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(answer);

  const handleSubmit = async (e: BusinessPlanSchema) => {
    try {
      const formData = new FormData();
      formData.append('businessPlanSchemaLength', e.businessPlanSchemaLength.toString());
      formData.append('businessName', e.businessName);
      formData.append('businessPurpose', e.businessPurpose);
      formData.append('targetMarket', e.targetMarket);
      formData.append('businessModel', e.businessModel);
      formData.append('competitiveAdvantage', e.competitiveAdvantage);
      formData.append('financialProjection', e.financialProjection);
      formData.append('activeTab', e.activeTab);
      const id = uniqueId();
      // const props = {
      //   id,
      //   businessName: e.businessName,
      //   businessPurpose: e.businessPurpose,
      //   targetMarket: e.targetMarket,
      //   businessModel: e.businessModel,
      //   competitiveAdvantage: e.competitiveAdvantage,
      //   financialProjection: e.financialProjection,
      // };
      const response = await createBusinessPlan(
        id,
        e.businessName,
        e.businessPurpose,
        e.targetMarket,
        e.businessModel,
        e.competitiveAdvantage,
        e.financialProjection
      );
      if ('answer' in response) {
        dispatch(setResult({ answer: response.answer ?? '', feedbackAt: undefined }));
        dispatch(setId(id));
        toast.success(getMessage('I_F_00030', '作成結果'));
        switchLayout(LAYOUT_RIGHT_ONLY);
      } else {
        toast.error(response.error ?? getMessage('E_F_00110', '作成結果'));
      }
    } catch (error) {
      console.error('Error creating minutes:', error);
      toast.error(getMessage('E_F_00110', '作成結果'));
    }
  };

  return (
    <PageLayout className="flex flex-col">
      <BusinessPlanTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />

      <Form {...form}>
        <form
          className="flex flex-1 gap-x-10 overflow-hidden"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          {(isLeftOnly || isTwoColumns) && (
            <CreateBusinessPlanForm
              className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px]')}
            />
          )}
          {(isRightOnly || isTwoColumns) && (
            <BusinessPlanResult className={cn('w-full', isTwoColumns && 'w-2/3')} />
          )}
        </form>
      </Form>
    </PageLayout>
  );
}

export default BusinessPlanPage;
