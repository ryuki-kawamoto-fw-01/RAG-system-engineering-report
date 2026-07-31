import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useFormRedux } from '@/app/_hooks/use_form';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { Form } from '../../../_components/ui/form';
import { useAppDispatch, useAppSelector } from '../../../_store/hooks';
import { setResult } from '../../../_store/slice/create-design-document';
import { NewDesignDocument } from '../_actions/create-new-design-document';
import { DesignNewDocumentSchema, designNewDocumentSchema } from '../_utills/schema';
import RequestForm from './create-design-document-request-form';
import ResultArea from './result-area';

type Props = {
  className?: string;
};

export default function Results({ className }: Props) {
  const { newRequest, result, id } = useAppSelector((state) => state.designDocument);
  console.log('Results コンポーネントのレンダリング時のRedux状態:', { newRequest, result, id });
  const dispatch = useAppDispatch();

  const form = useFormRedux<DesignNewDocumentSchema>({
    resolver: zodResolver(designNewDocumentSchema),
    values: {
      newRequest,
      result,
    } as DesignNewDocumentSchema,
  });

  const handleNewDesignDocument = async (e: DesignNewDocumentSchema) => {
    try {
      console.log('追加リクエスト開始:', e);

      if (!e.result) {
        console.error('結果が空です');
        toast.error('現在の設計書が空のため、追加リクエストを実行できません');
        return;
      }

      const response = await NewDesignDocument(e.result, e.newRequest!);
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

      dispatch(setResult(response.answer));
      toast.success(getMessage('I_F_00040', '作成結果'));
      return response;
    } catch (error) {
      console.error('設計書の追加リクエストエラー:', error);
      toast.error('設計書の追加に失敗しました');
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleNewDesignDocument)}
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
