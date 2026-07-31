import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useFormRedux } from '@/app/_hooks/use_form';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { Form } from '../../../_components/ui/form';
import { useAppDispatch, useAppSelector } from '../../../_store/hooks';
import { setResult } from '../../../_store/slice/technology-training';
import { FixTraining } from '../_actions/fixTraining';
import { FixTrainingSchema, fixTrainingSchema } from '../_utils/schema';
import FixTrainingRequestForm from './fix-training-request-form';
import TrainingPlanResultArea from './training-plan-result-area';

type Props = {
  className?: string;
};

export default function TrainigPlanResults({ className }: Props) {
  const { fixTrainingRequest, result, id, feedbackAt } = useAppSelector(
    (state) => state.technologyTraining
  );
  const dispatch = useAppDispatch();
  const form = useFormRedux<FixTrainingSchema>({
    resolver: zodResolver(fixTrainingSchema),
    values: {
      fixTrainingRequest,
      result,
    } as FixTrainingSchema,
  });

  const handleFixTraining = async (e: FixTrainingSchema) => {
    try {
      const response = await FixTraining(e.result, e.fixTrainingRequest!, id);
      if ('error' in response) {
        toast.error(response.error);
      } else {
        dispatch(setResult({ result: response.answer, feedbackAt }));
        toast.success(getMessage('I_F_00040', '作成結果'));
      }
      return response;
    } catch {
      toast.error('トレーニング計画の修正に失敗しました');
    }
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFixTraining)}
        className={cn('flex h-full flex-col relative', className)}
      >
        <div className="h-full overflow-y-auto">
          <div className="flex h-[calc(100%+48px)] flex-col">
            {/* トレーニング計画作成結果エリア */}
            <TrainingPlanResultArea className="mb-4 flex h-[calc((100%-48px)*0.65)] pb-6" />
            {/* トレーニング計画修正依頼エリア */}
            <FixTrainingRequestForm className="mt-2 h-[calc((100%-48px)*0.35)]" />
          </div>
        </div>
      </form>
    </Form>
  );
}
