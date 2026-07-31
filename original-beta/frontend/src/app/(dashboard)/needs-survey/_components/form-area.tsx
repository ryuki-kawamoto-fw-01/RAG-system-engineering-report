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
import { setResult, setId } from '../../../_store/slice/needs-survey';
import { NeedsSurvey } from '../_actions/needs-survey';
import { NeedsSurveySchema, needsSurveySchema } from '../_utils/schema';
import NeedsSurveyButton from './needs-survey-button';
import NeedsSurveyConsiderationArea from './needs-survey-consideration-area';
import NeedsSurveyIndustryArea from './needs-survey-industry-area';
import NeedsSurveyPersonaArea from './needs-survey-persona-area';
import NeedsSurveyProductArea from './needs-survey-product-area';
import NeedsSurveyPurposeArea from './needs-survey-purpose-area';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function FormArea({ switchLayout, className }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result, newRequest, ...defaultValues } = useAppSelector((state) => state.needsSurvey);
  const dispatch = useAppDispatch();
  const form = useFormRedux<NeedsSurveySchema>({
    resolver: zodResolver(needsSurveySchema),
    values: defaultValues,
  });

  const handleCreateIdea = async (e: NeedsSurveySchema) => {
    try {
      console.log('ニーズ調査作成開始:', e);
      const id = uniqueId();
      console.log('生成ID:', id);

      // 詳細なログ
      try {
        const response = await NeedsSurvey(
          id,
          e.industry,
          e.purpose,
          e.product,
          e.persona,
          e.additionalConsiderations || ''
        );

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
        dispatch(setResult({ result: response.answer, feedbackAt: undefined }));
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
          {/* 業界・市場入力フォーム */}
          <NeedsSurveyIndustryArea />
          {/* 目的入力フォーム */}
          <NeedsSurveyPurposeArea />
          {/* 商品・サービスの概要フォーム */}
          <NeedsSurveyProductArea />
          {/* 顧客ペルソナ入力フォーム */}
          <NeedsSurveyPersonaArea />
          {/* アイデアの考慮事項入力フォーム */}
          <NeedsSurveyConsiderationArea />
          {/* アイデア作成ボタン */}
          <NeedsSurveyButton />
        </div>
      </form>
    </Form>
  );
}
