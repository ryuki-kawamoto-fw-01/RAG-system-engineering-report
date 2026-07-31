import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Form } from '../../../_components/ui/form';
import { useFormRedux } from '../../../_hooks/use_form';
import { useAppDispatch, useAppSelector } from '../../../_store/hooks';
import { setResult } from '../../../_store/slice/defect-analysis-report';
import { getMessage } from '../../../_utils/message';
import { cn } from '../../../_utils/tw-merge';
import {
  DefectAnalysisReportReAnalysisSchema,
  defectAnalysisReportReAnalysisSchema,
} from '../_utils/schema';
import { reanalysis } from '../actions/reanalysis';
import AnalysisResultArea from './analysis-result-area';
import DefectReanalysisRequest from './defect-reanalysis-request';

type Props = {
  className?: string;
};

export default function AnalysisDisplay({ className }: Props) {
  const { modify, result, id, feedbackAt } = useAppSelector((state) => state.defectAnalysisReport);
  const dispatch = useAppDispatch();
  const form = useFormRedux<DefectAnalysisReportReAnalysisSchema>({
    resolver: zodResolver(defectAnalysisReportReAnalysisSchema),
    values: {
      modify,
      result,
    } as DefectAnalysisReportReAnalysisSchema,
  });

  const handleReanalysis = async (e: DefectAnalysisReportReAnalysisSchema) => {
    try {
      const formData = new FormData();
      formData.append('result', e.result);
      formData.append('modify', e.modify!);

      const response = await reanalysis(id, formData);

      if ('error' in response) {
        toast.error(response.error);
      } else {
        dispatch(setResult({ result: response.answer, feedbackAt }));
        toast.success(getMessage('I_F_00040', '分析結果'));
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(getMessage('E_F_00110', '分析結果'));
      }
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleReanalysis)}
        className={cn('size-full flex flex-col relative', className)}
      >
        <div className="h-full overflow-y-auto">
          <div className="h-[calc(100%+48px)]">
            <AnalysisResultArea className="flex h-[calc((100%-48px)*4/5)] flex-col" />
            <DefectReanalysisRequest className="h-[calc((100%-48px)/5)]" />
          </div>
        </div>
      </form>
    </Form>
  );
}
