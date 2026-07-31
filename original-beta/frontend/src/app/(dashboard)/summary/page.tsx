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
import { setResult, setId } from '@/app/_store/slice/summary';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { createSummary } from './_actions/createSummary';
import CreateSummaryForm from './_components/create-summary-form';
import SummaryResult from './_components/summary-result';
import SummaryTitle from './_components/summary-title';
import { SummarySchema, summarySchema } from './_utils/schema';

function SummaryPage() {
  const dispatch = useAppDispatch();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result, ...defaultValues } = useAppSelector((state) => state.summary);
  const form = useFormRedux<SummarySchema>({
    resolver: zodResolver(summarySchema),
    values: defaultValues,
  });
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(result);

  const handleSubmit = async (e: SummarySchema) => {
    try {
      const formData = new FormData();
      formData.append('summaryLength', e.summaryLength.toString());
      formData.append('content', e.content);
      formData.append('consideration', e.consideration!);
      formData.append('activeTab', e.activeTab);
      const id = uniqueId();
      const response = await createSummary(id, formData);
      if (response.success) {
        dispatch(setResult({ result: response.content ?? '', feedbackAt: undefined }));
        dispatch(setId(id));
        toast.success(getMessage('I_F_00030', '要約結果'));
        switchLayout(LAYOUT_RIGHT_ONLY);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('Error creating minutes:', error);
      toast.error(getMessage('E_F_00110', '要約結果'));
    }
  };

  return (
    <PageLayout className="flex flex-col">
      <SummaryTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />

      <Form {...form}>
        <form
          className="flex flex-1 gap-x-10 overflow-hidden"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          {(isLeftOnly || isTwoColumns) && (
            <CreateSummaryForm
              className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px]')}
            />
          )}
          {(isRightOnly || isTwoColumns) && (
            <SummaryResult className={cn('w-full', isTwoColumns && 'w-2/3')} />
          )}
        </form>
      </Form>
    </PageLayout>
  );
}

export default SummaryPage;
