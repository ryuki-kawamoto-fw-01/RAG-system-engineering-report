import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Form } from '@/app/_components/ui/form';
import { LAYOUT_RIGHT_ONLY, LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setId, setResult } from '@/app/_store/slice/risk-assessment';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { createRiskAssessment } from '../_actions/riskAssessment';
import { riskAssessmentSchema, RiskAssessmentSchema } from '../_utils/schema';
import CreateRiskAssessmentButton from './create-risk-assessment-button';
import CurrentMeasuresInput from './current-measures-input';
import MachineInfoInput from './machine-info-input';
import ProcessDetailsInput from './process-details-input';
import WorkerCountAndPlacementInput from './woker-count-and-placement-input';
import WorkerInfoInput from './worker-info-input';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};
export default function RiskAssessmentFormArea({ switchLayout, className }: Props) {
  const { ...defaultValues } = useAppSelector((state) => state.riskAssessment);
  const dispatch = useAppDispatch();
  const form = useFormRedux<RiskAssessmentSchema>({
    resolver: zodResolver(riskAssessmentSchema),
    values: defaultValues,
  });
  const onSubmit = async (e: RiskAssessmentSchema) => {
    try {
      const id = uniqueId();
      const response = await createRiskAssessment(
        id,
        e.workerInfo,
        e.machineInfo,
        e.workerCountAndPlacement,
        e.processDetails,
        e.currentMeasures
      );
      if ('error' in response) {
        toast.error(response.error);
      } else {
        dispatch(setResult({ result: response.result, feedbackAt: undefined }));
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
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('relative flex flex-col h-full', className)}
      >
        <div className="flex-1 space-y-3 overflow-y-auto pb-[48px]">
          {/* 作業者情報 */}
          <WorkerInfoInput />
          {/* 使用機器 */}
          <MachineInfoInput />
          {/* 人数と配置 */}
          <WorkerCountAndPlacementInput />
          {/* 作業詳細 */}
          <ProcessDetailsInput />
          {/* 現状の対策内容 */}
          <CurrentMeasuresInput />
          <CreateRiskAssessmentButton />
        </div>
      </form>
    </Form>
  );
}
