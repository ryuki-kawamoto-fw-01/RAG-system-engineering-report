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
import { setResult, setId } from '../../../_store/slice/create-design-document';
import { DesignDocument } from '../_actions/create-design-document';
import { DesignDocumentSchema, designDocumentSchema } from '../_utills/schema';
import DesignDocumentButton from './create-design-document-button';
import DesignDocumentConsiderationArea from './create-design-document-consideration-area';
import DesignDocumentFeatureArea from './create-design-document-feature-area';
import DesignDocumentProductArea from './create-design-document-product-area';
import DesignDocumentPurposeArea from './create-design-document-purpose-area';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function FormArea({ switchLayout, className }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result, newRequest, ...defaultValues } = useAppSelector((state) => state.designDocument);
  const dispatch = useAppDispatch();
  const form = useFormRedux<DesignDocumentSchema>({
    resolver: zodResolver(designDocumentSchema),
    values: defaultValues,
  });

  const handleCreateIdea = async (e: DesignDocumentSchema) => {
    try {
      console.log('設計書作成開始:', e);
      const id = uniqueId();
      console.log('生成ID:', id);

      // 詳細なログ
      try {
        const response = await DesignDocument(
          id,
          e.product,
          e.purpose,
          e.feature,
          e.additionalConsiderations
        );

        // レスポンスの構造を詳細に調査
        console.log('バックエンドからのレスポンス（型）:', typeof response);
        console.log('バックエンドからのレスポンス（キー）:', Object.keys(response));
        console.log('バックエンドからのレスポンス（詳細）:', JSON.stringify(response, null, 2));

        // エラーの場合は詳細情報を出力
        if ('error' in response) {
          console.error('エラー詳細:', {
            message: response.error,
            type: typeof response.error,
            length: response.error.length,
          });
          toast.error(response.error);
          return;
        }

        // 以下は元のコード
        if (!response.answer) {
          console.error('応答内容が空です:', response);
          toast.error(getMessage('E_F_00110', '作成結果'));
          return;
        }

        console.log('応答の詳細:', {
          answerType: typeof response.answer,
          answerLength: response.answer.length,
          answerSample: response.answer.substring(0, 100) + '...',
          logExists: !!response.log,
        });

        console.log('Reduxストア更新前:', { result, id });
        dispatch(setResult(response.answer));
        dispatch(setId(id));
        console.log('Reduxストア更新後:', { result: response.answer, id });

        toast.success(getMessage('I_F_00030', '作成結果'));
        switchLayout(LAYOUT_RIGHT_ONLY);
      } catch (actionError) {
        // サーバーアクション内部でのエラーをキャッチ
        console.error('サーバーアクション実行エラー:', actionError);
        if (actionError instanceof Error) {
          console.error('エラー名:', actionError.name);
          console.error('エラーメッセージ:', actionError.message);
          console.error('エラースタック:', actionError.stack);
        }
        throw actionError; // 外側のcatchでも処理できるように再スロー
      }
    } catch (error) {
      console.error('エラーの詳細（型）:', typeof error);

      if (error instanceof Error) {
        console.error('エラー名:', error.name);
        console.error('エラーメッセージ:', error.message);
        console.error('エラースタック:', error.stack);
        toast.error(`詳細エラー: ${error.name} - ${error.message.substring(0, 100)}`);
      } else {
        console.error('未知の形式のエラー:', error);
        toast.error(getMessage('E_F_00110', '作成結果'));
      }
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleCreateIdea)}
        className={cn('relative flex flex-col h-full', className)}
      >
        <div className="flex-1 space-y-3 overflow-y-auto pb-[48px]">
          {/* 製品名入力フォーム */}
          <DesignDocumentProductArea />
          {/* 製品の目的・用途入力フォーム */}
          <DesignDocumentPurposeArea />
          {/* 主な機能・性能要件入力フォーム */}
          <DesignDocumentFeatureArea />
          {/* アイデアの考慮事項入力フォーム */}
          <DesignDocumentConsiderationArea />
          {/* アイデア作成ボタン */}
          <DesignDocumentButton />
        </div>
      </form>
    </Form>
  );
}
