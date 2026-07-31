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
import { setResult, setId } from '../../../_store/slice/technology-training';
import { technologyTraining } from '../_actions/technologyTraining';
import { TechnologyTrainingSchema, technologyTrainingSchema } from '../_utils/schema';
import ConsiderationForm from './consideration-form';
import LeaningLevelForm from './learning-level-form';
import StudyTimeForm from './study-time-form';
import TechnologyForm from './technology-form';
import TechnologyTrainingButton from './technology-training-button';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function TrainingFormArea({ switchLayout, className }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result, fixTrainingRequest, ...defaultValues } = useAppSelector(
    (state) => state.technologyTraining
  );
  const dispatch = useAppDispatch();
  const form = useFormRedux<TechnologyTrainingSchema>({
    resolver: zodResolver(technologyTrainingSchema),
    values: defaultValues,
  });

  const handleTechnologyTraining = async (e: TechnologyTrainingSchema) => {
    try {
      const id = uniqueId();
      const response = await technologyTraining(id, e.technology, e.level, e.time, e.consideration);
      if ('error' in response) {
        toast.error(response.error);
      } else {
        dispatch(setResult({ result: response.answer, feedbackAt: undefined }));
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
        onSubmit={form.handleSubmit(handleTechnologyTraining)}
        className={cn('relative flex flex-col h-full', className)}
      >
        <div className="flex-1 space-y-3 overflow-y-auto pb-[48px]">
          {/* 学習したい技術入力フォーム */}
          <TechnologyForm />
          {/* 学習レベル入力フォーム */}
          <LeaningLevelForm />
          {/* 学習時間入力フォーム */}
          <StudyTimeForm />
          {/* 考慮事項入力フォーム */}
          <ConsiderationForm />
          {/* トレーニング計画作成ボタン */}
          <TechnologyTrainingButton />
        </div>
      </form>
    </Form>
  );
}
