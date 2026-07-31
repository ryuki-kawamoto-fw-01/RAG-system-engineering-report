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
import { setResult, setId } from '@/app/_store/slice/quality-standard-document';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { createQualityStandardDocument } from './_actions/createQualityStandardDocument';
import CreateQualityStandardDocumentForm from './_components/create-quality-standard-document-form';
import QualityStandardDocumentResult from './_components/quality-standard-document-result';
import QualityStandardDocumentTitle from './_components/quality-standard-document-title';
import { QualityStandardDocumentSchema, qualityStandardDocumentSchema } from './_utils/schema';

export default function QualityStandardDocumentPage() {
  const dispatch = useAppDispatch();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result, id, feedbackAt, ...defaultValues } = useAppSelector(
    (state) => state.qualityStandardDocument
  );
  const form = useFormRedux<QualityStandardDocumentSchema>({
    resolver: zodResolver(qualityStandardDocumentSchema),
    values: defaultValues,
  });
  const { layout, isTwoColumns, isLeftOnly, isRightOnly, switchLayout } = useUseCaseLayout(result);

  const handleSubmit = async (data: QualityStandardDocumentSchema) => {
    try {
      const id = uniqueId();
      const response = await createQualityStandardDocument(id, data);
      if (!response.success) {
        toast.error(response.message);
      } else {
        dispatch(setResult({ result: response.content!, feedbackAt: undefined }));
        dispatch(setId(id));
        toast.success(getMessage('I_F_00030', '品質標準文書作成'));
        switchLayout(LAYOUT_RIGHT_ONLY);
      }
    } catch (error) {
      console.error('Error creating quality standard document:', error);
      toast.error(getMessage('E_F_00110', '品質標準文書作成'));
    }
  };

  return (
    <PageLayout className="flex flex-col">
      <QualityStandardDocumentTitle />
      <LayoutSwitchButton currentLayout={layout} switchLayout={switchLayout} className="mt-3" />

      <Form {...form}>
        <form
          className="flex flex-1 gap-x-10 overflow-hidden"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          {(isLeftOnly || isTwoColumns) && (
            <CreateQualityStandardDocumentForm
              className={cn('w-full pt-[11px]', isTwoColumns && 'w-1/3 min-w-[300px]')}
            />
          )}
          {(isRightOnly || isTwoColumns) && (
            <QualityStandardDocumentResult className={cn('w-full', isTwoColumns && 'w-2/3')} />
          )}
        </form>
      </Form>
    </PageLayout>
  );
}
