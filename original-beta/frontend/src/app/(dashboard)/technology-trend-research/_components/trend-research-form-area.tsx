'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Form } from '@/app/_components/ui/form';
import { LAYOUT_RIGHT_ONLY, LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { useAppDispatch, useAppSelector } from '@/app/_store/hooks';
import { setResult, setId } from '@/app/_store/slice/technology-trend-research';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { technologytrendResearch } from '../_actions/technology-trend-research';
import { TechnologyTrendResearchSchema, technologytrendResearchSchema } from '../_utils/schema';
import ReportFormatForm from './report-format-form';
import TargetAreaForm from './target-area-form';
import TechnicalFieldForm from './technical-field-form';
import TechnologyTrendResearchButton from './technology-trend-reserch-button';
import TimeRangeForm from './time-range-form';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function TrendResearchFormArea({ switchLayout, className }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result, ...defaultValues } = useAppSelector((state) => state.technologytrendResearch);
  const dispatch = useAppDispatch();
  const form = useFormRedux<TechnologyTrendResearchSchema>({
    resolver: zodResolver(technologytrendResearchSchema),
    values: defaultValues,
  });

  const handleTechnologyTrendResearch = async (e: TechnologyTrendResearchSchema) => {
    try {
      const id = uniqueId();
      const response = await technologytrendResearch(id, e.field, e.range, e.area, e.format);
      dispatch(setResult(response.answer));
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
        onSubmit={form.handleSubmit(handleTechnologyTrendResearch)}
        className={cn('relative flex flex-col h-full', className)}
      >
        <div className="flex-1 space-y-3 overflow-y-auto pb-[48px]">
          {/* 技術分野入力フォーム */}
          <TechnicalFieldForm />
          {/* 時間範囲入力フォーム */}
          <TimeRangeForm />
          {/* 対象地域入力フォーム */}
          <TargetAreaForm />
          {/* レポート形式入力フォーム */}
          <ReportFormatForm />
          {/* レポート作成ボタン */}
          <TechnologyTrendResearchButton />
        </div>
      </form>
    </Form>
  );
}
