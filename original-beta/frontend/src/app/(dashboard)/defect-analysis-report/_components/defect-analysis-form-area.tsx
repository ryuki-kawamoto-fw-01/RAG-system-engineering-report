'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Form } from '../../../_components/ui/form';
import { LAYOUT_RIGHT_ONLY, LayoutType } from '../../../_constants/common-usecase';
import { useFormRedux } from '../../../_hooks/use_form';
import { useAppDispatch, useAppSelector } from '../../../_store/hooks';
import { setResult, setId } from '../../../_store/slice/defect-analysis-report';
import { getMessage } from '../../../_utils/message';
import { cn } from '../../../_utils/tw-merge';
import { uniqueId } from '../../../_utils/uniqueId';
import { DefectAnalysisReportSchema, defectAnalysisReportSchema } from '../_utils/schema';
import { defectAnalysisReport } from '../actions/defect-analysis-report';
import DefectAnalysisReportSubmitButton from './defect-analysis-report-submit-button';
import DefectConsideration from './defect-consideration';
import DefectData from './defect-data';
import DefectDescription from './defect-description';
import DefectImpactScope from './defect-impact-scope';
import DefectOccurenceCondition from './defect-occurence-condition';
import DefectProductName from './defect-product-name';
import DefectUsageEnvironment from './defect-usage-environment';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function DefectAnalysisFormArea({ switchLayout, className }: Props) {
  const { ...defaultValues } = useAppSelector((state) => state.defectAnalysisReport);
  const dispatch = useAppDispatch();
  const form = useFormRedux<DefectAnalysisReportSchema>({
    resolver: zodResolver(defectAnalysisReportSchema),
    values: defaultValues,
  });

  const handleSubmit = async (data: DefectAnalysisReportSchema) => {
    try {
      const id = uniqueId();

      const formData = new FormData();
      formData.append('productName', data.productName);
      formData.append('defectDescription', data.defectDescription);
      formData.append('occurenceCondition', data.occurenceCondition);
      formData.append('usageEnvironment', data.usageEnvironment);
      formData.append('impactScope', data.impactScope);
      formData.append('defectData', data.defectData);
      if (data.consideration) {
        formData.append('consideration', data.consideration);
      }

      const response = await defectAnalysisReport(id, formData);

      if ('error' in response) {
        toast.error(response.error);
      } else {
        dispatch(setResult({ result: response.answer, feedbackAt: undefined }));
        dispatch(setId(id));
        toast.success(getMessage('I_F_00030', '分析結果'));
        switchLayout(LAYOUT_RIGHT_ONLY);
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
    <div className={cn('size-full flex flex-col', className)}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="relative flex h-full flex-col">
          <div className="h-full space-y-3 overflow-y-auto pb-[48px]">
            <DefectProductName />
            <DefectDescription />
            <DefectOccurenceCondition />
            <DefectUsageEnvironment />
            <DefectImpactScope />
            <DefectData />
            <DefectConsideration />
          </div>
          <DefectAnalysisReportSubmitButton />
        </form>
      </Form>
    </div>
  );
}
