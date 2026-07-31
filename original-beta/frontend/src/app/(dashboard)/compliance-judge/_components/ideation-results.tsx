import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useFormRedux } from '@/app/_hooks/use_form';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { Form } from '../../../_components/ui/form';
import { useAppDispatch, useAppSelector } from '../../../_store/hooks';
import { setResult } from '../../../_store/slice/judge-idea';
import { judgeNewIdea } from '../_actions/judgeNewIdea';
import { JudgeNewIdeaSchema, judgeNewIdeaSchema } from '../_utils/schema';
import IdeationResultArea from './ideation-result-area';
import NewIdeaRequestForm from './new-idea-request-form';

type Props = {
  className?: string;
};

export default function IdeationResults({ className }: Props) {
  const { newJudgeRequest, result, id, feedbackAt } = useAppSelector((state) => state.judgeIdea);
  const dispatch = useAppDispatch();
  const form = useFormRedux<JudgeNewIdeaSchema>({
    resolver: zodResolver(judgeNewIdeaSchema),
    values: {
      newJudgeRequest,
      result,
    } as JudgeNewIdeaSchema,
  });

  const handleJudgeNewIdea = async (e: JudgeNewIdeaSchema) => {
    try {
      const response = await judgeNewIdea(e.result, e.newJudgeRequest!, id);
      if ('error' in response) {
        toast.error(response.error);
      } else {
        dispatch(setResult({ result: response.answer, feedbackAt }));
        toast.success(getMessage('I_F_00040', '作成結果'));
      }
      return response;
    } catch {
      toast.error('アイデアの評価に失敗しました');
    }
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleJudgeNewIdea)}
        className={cn('flex h-full flex-col relative', className)}
      >
        <div className="h-full overflow-y-auto">
          <div className="h-[calc(100%+48px)]">
            {/* アイデア評価結果エリア */}
            <IdeationResultArea className="flex h-[calc((100%-48px)*4/5)] flex-col pb-3" />
            {/* 追加で生成AIに依頼するエリア */}
            <NewIdeaRequestForm className="h-[calc((100%-48px)/5)]" />
          </div>
        </div>
      </form>
    </Form>
  );
}
