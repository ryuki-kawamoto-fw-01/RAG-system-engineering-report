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
import { setResult, setId, setQualityReport } from '../../../_store/slice/quality-report';
import { createQualityReport } from '../_actions/createQualityReport';
import { QualityReportInput, QualityReportSchema } from '../_utils/schema';
import QualityReportButton from './quality-report-button';
import QualityReportForm from './quality-report-form';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function QualityReportFormArea({ switchLayout, className }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result, id, feedbackAt, ...defaultValues } = useAppSelector(
    (state) => state.qualityReport
  );
  const dispatch = useAppDispatch();
  const form = useFormRedux<QualityReportInput>({
    resolver: zodResolver(QualityReportSchema),
    values: defaultValues,
  });

  const handleCreateQualityReport = async (data: QualityReportInput) => {
    try {
      const id = uniqueId();

      // フォームデータを状態に保存
      dispatch(setQualityReport(data));

      const response = await createQualityReport(id, data);

      if ('error' in response) {
        console.error('APIエラー:', response.error);
        toast.error(response.error);
      } else {
        dispatch(setResult({ result: response.answer, feedbackAt: undefined }));
        dispatch(setId(id));
        toast.success(getMessage('I_F_00030', '品質管理レポート'));
        switchLayout(LAYOUT_RIGHT_ONLY);

        return response;
      }
    } catch (error) {
      console.error('品質管理レポート作成エラー:', error);
      toast.error(getMessage('E_F_00110', '品質管理レポート'));
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleCreateQualityReport)}
        className={cn('relative flex flex-col h-full', className)}
      >
        <div className="flex-1 space-y-3 overflow-hidden pb-[48px]">
          <QualityReportForm />
          <QualityReportButton />
        </div>
      </form>
    </Form>
  );
}
