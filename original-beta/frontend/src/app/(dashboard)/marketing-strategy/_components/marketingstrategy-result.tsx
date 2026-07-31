import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useFormRedux } from '@/app/_hooks/use_form';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { Form } from '../../../_components/ui/form';
import { useAppDispatch, useAppSelector } from '../../../_store/hooks';
import { setResult } from '../../../_store/slice/marketingstrategy';
import { NewMarketingStrategy } from '../_actions/new-marketingstrategy';
import { NewMarketingStrategySchema, newMarketingStrategySchema } from '../_utils/schema';
import RequestForm from './marketingstrategy-request-form';
import ResultArea from './marketingstrategy-result-area';

type Props = {
  className?: string;
};

export default function Results({ className }: Props) {
  const { newRequest, result, id, feedbackAt } = useAppSelector((state) => state.marketingstrategy);
  console.log('Results コンポーネントのレンダリング時のRedux状態:', { newRequest, result, id });
  const dispatch = useAppDispatch();

  const form = useFormRedux<NewMarketingStrategySchema>({
    resolver: zodResolver(newMarketingStrategySchema),
    values: {
      newRequest,
      result,
    } as NewMarketingStrategySchema,
  });

  const handleNewMarketingStrategy = async (e: NewMarketingStrategySchema) => {
    try {
      console.log('追加リクエスト開始:', e);

      if (!e.result) {
        console.error('結果が空です');
        toast.error('現在のマーケティング戦略資料結果が空のため、追加リクエストを実行できません');
        return;
      }
      const response = await NewMarketingStrategy(e.result, e.newRequest!);
      console.log('追加リクエストのレスポンス:', response);

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
      console.error('マーケティング戦略資料の追加リクエストエラー:', error);
      toast.error('再マーケティング戦略資料作成に失敗しました');
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleNewMarketingStrategy)}
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
