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
import { setResult, setId } from '../../../_store/slice/brainstorming';
import { Brainstorming } from '../_actions/brainstorming';
import { BrainstormingSchema, brainstormingSchema } from '../_utils/schema';
import BrainstormingButton from './brainstorming-button';
import BrainstormingExpert1Area from './brainstorming-expert1-area';
import BrainstormingExpert2Area from './brainstorming-expert2-area';
import BrainstormingThemeArea from './brainstorming-theme-area';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function FormArea({ switchLayout, className }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result, newRequest, ...defaultValues } = useAppSelector((state) => state.brainstorming);
  const dispatch = useAppDispatch();
  const form = useFormRedux<BrainstormingSchema>({
    resolver: zodResolver(brainstormingSchema),
    values: defaultValues,
  });

  const handleCreateIdea = async (e: BrainstormingSchema) => {
    try {
      const id = uniqueId();

      // 詳細なログ
      try {
        const response = await Brainstorming(id, e.theme, e.expert1, e.expert2);

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

        dispatch(setResult({ result: response.answer, feedbackAt: undefined }));
        dispatch(setId(id));

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
          {/* メインテーマ入力フォーム */}
          <BrainstormingThemeArea />
          {/* 専門家１入力フォーム */}
          <BrainstormingExpert1Area />
          {/* 専門家２入力フォーム */}
          <BrainstormingExpert2Area />
          {/* ブレインストーミング開始ボタン */}
          <BrainstormingButton />
        </div>
      </form>
    </Form>
  );
}
