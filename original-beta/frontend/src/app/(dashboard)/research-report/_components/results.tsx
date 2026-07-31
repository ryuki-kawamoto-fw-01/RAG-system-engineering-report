import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useFormRedux } from '@/app/_hooks/use_form';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { Form } from '../../../_components/ui/form';
import { useAppDispatch, useAppSelector } from '../../../_store/hooks';
import { setResult } from '../../../_store/slice/research-report';
import { researchNewReport } from '../_actions/researchNewReport';
import { ResearchNewReportSchema, researchNewReportSchema } from '../_utils/schema';
import RequestForm from './research-report-request-form';
import ResultArea from './result-area';

type Props = {
  className?: string;
};

export default function Results({ className }: Props) {
  const { newRequest, result, id } = useAppSelector((state) => state.researchReport);
  const dispatch = useAppDispatch();
  const form = useFormRedux<ResearchNewReportSchema>({
    resolver: zodResolver(researchNewReportSchema),
    values: {
      newRequest,
      result,
    } as ResearchNewReportSchema,
  });

  const handleResearchNewReport = async (e: ResearchNewReportSchema) => {
    try {
      const response = await researchNewReport(e.result, e.newRequest!, id);
      if ('error' in response) {
        toast.error(response.error);
      } else {
        dispatch(setResult(response.answer));
        toast.success(getMessage('I_F_00040', '作成結果'));
      }
      return response;
    } catch {
      toast.error('研究報告書の追加に失敗しました');
    }
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleResearchNewReport)}
        className={cn('flex h-full flex-col relative', className)}
      >
        <div className="h-full overflow-y-auto">
          <div className="h-[calc(100%+48px)]">
            {/* アイデア作成結果エリア */}
            <ResultArea className="flex h-[calc((100%-48px)*4/5)] flex-col pb-3" />
            {/* 追加で生成AIに依頼するエリア */}
            <RequestForm className="h-[calc((100%-48px)/5)]" />
          </div>
        </div>
      </form>
    </Form>
  );
}
