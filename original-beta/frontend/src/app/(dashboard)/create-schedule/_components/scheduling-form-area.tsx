'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Form } from '@/app/_components/ui/form';
import { LAYOUT_RIGHT_ONLY, LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setResult, setId } from '@/app/_store/slice/create-schedule';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { createSchedule } from '../_actions/createSchedule';
import { CreateScheduleSchema, createScheduleSchema } from '../_utils/schema';
import CreateScheduleButton from './create-schedule-button';
import SchedulingConsiderationForm from './scheduling-consideration-form';
import SchedulingEndDateForm from './scheduling-end-date-form';
import SchedulingStartDateForm from './scheduling-start-date-form';
import SchedulingWorkForm from './scheduling-work-form';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function ScheduleFormArea({ switchLayout, className }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result, newScheduleRequest, ...defaultValues } = useAppSelector(
    (state) => state.createSchedule
  );
  const dispatch = useAppDispatch();
  const form = useFormRedux<CreateScheduleSchema>({
    resolver: zodResolver(createScheduleSchema),
    values: defaultValues,
  });

  const handleCreateSchedule = async (e: CreateScheduleSchema) => {
    try {
      const id = uniqueId();
      const response = await createSchedule(
        id,
        e.newSchedulework,
        e.newSchedulestartdate ? e.newSchedulestartdate.toISOString().slice(0, 10) : '',
        e.newScheduleenddate ? e.newScheduleenddate.toISOString().slice(0, 10) : '',
        e.newScheduleConsiderations
      );
      dispatch(setResult({ result: response.answer, feedbackAt: undefined }));
      dispatch(setId(id));
      toast.success(getMessage('I_F_00030', '作成結果'));
      switchLayout(LAYOUT_RIGHT_ONLY);

      return response;
    } catch {
      toast.error(getMessage('E_F_00110', '作成結果'));
    }
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleCreateSchedule)}
        className={cn('relative flex flex-col h-full', className)}
      >
        <div className="flex-1 space-y-3 overflow-y-auto">
          {/* 主題入力フォーム */}
          <SchedulingWorkForm />
          {/* スケジュール開始日入力フォーム */}
          <SchedulingStartDateForm />
          {/* スケジュール終了日入力フォーム */}
          <SchedulingEndDateForm />
          {/* スケジュールの考慮事項入力フォーム */}
          <SchedulingConsiderationForm />
          {/* スケジュール作成ボタン */}
          <CreateScheduleButton />
        </div>
      </form>
    </Form>
  );
}
