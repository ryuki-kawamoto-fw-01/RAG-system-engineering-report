import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useFormRedux } from '@/app/_hooks/use_form';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { Form } from '../../../_components/ui/form';
import { useAppDispatch, useAppSelector } from '../../../_store/hooks';
import { setResult } from '../../../_store/slice/brainstorming';
import { NewBrainstorming } from '../_actions/new-brainstorming';
import { NewBrainstormingSchema, newBrainstormingSchema } from '../_utils/schema';
import RequestForm from './brainstorming-request-form';
import ResultArea from './result-area';

type Props = {
  className?: string;
};

export default function Results({ className }: Props) {
  const { newRequest, result, feedbackAt } = useAppSelector((state) => state.brainstorming);
  const dispatch = useAppDispatch();

  const form = useFormRedux<NewBrainstormingSchema>({
    resolver: zodResolver(newBrainstormingSchema),
    values: {
      newRequest,
      result,
    } as NewBrainstormingSchema,
  });

  const handleNewBrainstorming = async (e: NewBrainstormingSchema) => {
    try {
      if (!e.result) {
        console.error('結果が空です');
        toast.error('現在のブレインストーミング結果が空のため、追加リクエストを実行できません');
        return;
      }
      const response = await NewBrainstorming(e.result, e.newRequest!);

      if ('error' in response) {
        toast.error(response.error);
        return;
      }

      if (!response.answer) {
        console.error('応答内容が空です:', response);
        toast.error('空の応答が返されました');
        return;
      }

      // 再作成時は既存のフィードバック状態を維持する
      dispatch(setResult({ result: response.answer, feedbackAt }));
      toast.success(getMessage('I_F_00040', '作成結果'));
      return response;
    } catch (error) {
      console.error('ブレインストーミングの追加リクエストエラー:', error);
      toast.error('再ブレインストーミングに失敗しました');
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleNewBrainstorming)}
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
