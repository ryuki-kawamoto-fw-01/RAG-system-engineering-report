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
import { setResult, setId } from '../../../_store/slice/judge-idea';
import { judgeIdea } from '../_actions/judgeIdea';
import { JudgeIdeaSchema, judgeIdeaSchema } from '../_utils/schema';
import IdeationCountryForm from './ideation-country-form';
import IdeationFunctionForm from './ideation-function-form';
import IdeationMarketForm from './ideation-market-form';
import IdeationUseForm from './ideation-use-form';
import JudgeIdeaButton from './judge-idea-button';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function IdeationFormArea({ switchLayout, className }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result, newJudgeRequest, ...defaultValues } = useAppSelector((state) => state.judgeIdea);
  const dispatch = useAppDispatch();
  const form = useFormRedux<JudgeIdeaSchema>({
    resolver: zodResolver(judgeIdeaSchema),
    values: defaultValues,
  });

  const handleJudgeIdea = async (e: JudgeIdeaSchema) => {
    try {
      const id = uniqueId();
      const response = await judgeIdea(id, e.function, e.use, e.market, e.country);
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
        onSubmit={form.handleSubmit(handleJudgeIdea)}
        className={cn('relative flex flex-col h-full', className)}
      >
        <div className="flex-1 space-y-3 overflow-y-auto pb-[48px]">
          {/* 機能入力フォーム */}
          <IdeationFunctionForm />
          {/* 用途入力フォーム */}
          <IdeationUseForm />
          {/* 市場入力フォーム */}
          <IdeationMarketForm />
          {/* 地域入力フォーム */}
          <IdeationCountryForm />
          {/* アイデア評価ボタン */}
          <JudgeIdeaButton />
        </div>
      </form>
    </Form>
  );
}
