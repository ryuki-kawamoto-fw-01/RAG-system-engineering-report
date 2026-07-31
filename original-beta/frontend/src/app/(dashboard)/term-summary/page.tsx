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
import { setTermSummaryResult } from '@/app/_store/slice/term-summary';
import { setTermExplanation } from '@/app/_store/slice/term-summary';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { createTermSummary } from './_actions/createTermSummary';
import CreateSummaryForm from './_components/create-term-summary-form';
import SummaryResult from './_components/term-summary-result';
import SummaryTitle from './_components/term-summary-title';
import { SummarySchema, summarySchema } from './_utils/schema';

function SummaryPage() {
  const dispatch = useAppDispatch();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { termSummaryResult, ...defaultValues } = useAppSelector((state) => state.termSummary);
  const form = useFormRedux<SummarySchema>({
    resolver: zodResolver(summarySchema),
    values: defaultValues,
  });
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } =
    useUseCaseLayout(termSummaryResult);

  const handleSubmit = async (e: SummarySchema) => {
    try {
      const requestBody = {
        domain: e.domain,
        content: e.content,
        consideration: e.consideration ?? '',
      };

      const response = await createTermSummary(requestBody);
      dispatch(setTermSummaryResult(response.term_summary_result ?? ''));
      dispatch(setTermExplanation(response.term_explanation ?? ''));
      toast.success(getMessage('I_F_00030', '要約'));

      switchLayout(LAYOUT_RIGHT_ONLY);
    } catch {
      toast.error(getMessage('E_F_00330', '要約'));
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
            <CreateSummaryForm className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 ')} />
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
