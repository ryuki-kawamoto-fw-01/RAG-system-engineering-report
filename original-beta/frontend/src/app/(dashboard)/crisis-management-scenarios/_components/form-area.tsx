'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Control } from 'react-hook-form';
import { toast } from 'sonner';
import { LAYOUT_RIGHT_ONLY, LayoutType } from '@/app/_constants/common-usecase';
import { useFormRedux } from '@/app/_hooks/use_form';
import { CrisisManagementScenariosState } from '@/app/_store/slice/crisis-management-scenarios';
import { getMessage } from '@/app/_utils/message';
import { cn } from '@/app/_utils/tw-merge';
import { uniqueId } from '@/app/_utils/uniqueId';
import { Form } from '../../../_components/ui/form';
import { useAppDispatch, useAppSelector } from '../../../_store/hooks';
import { setResult, setId } from '../../../_store/slice/crisis-management-scenarios';
import { CrisisManagementScenarios } from '../_actions/crisis-management-scenarios';
import { CrisisManagementScenariosSchema, crisisManagementScenariosSchema } from '../_utils/schema';
import CrisisManagementScenariosBusinessContentArea from './crisis-management-scenarios-business-content-area';
import CrisisManagementScenariosBusinessSizeArea from './crisis-management-scenarios-business-size-area';
import CrisisManagementScenariosButton from './crisis-management-scenarios-button';
import CrisisManagementScenariosConsiderationArea from './crisis-management-scenarios-consideration-area';
import CrisisManagementScenariosIndustryArea from './crisis-management-scenarios-industry-area';
import RiskCategoryCheckArea from './crisis-management-scenarios-risk-category-check-area';
import CrisisManagementScenariosAdditionalContentsArea from './crisis-management-scenarios-risk-contents-area';

type Props = {
  switchLayout: (layout: LayoutType) => void;
  className?: string;
};

export default function FormArea({ switchLayout, className }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { result, newRequest, ...defaultValues } = useAppSelector(
    (state) => state.crisisManagementScenarios
  );
  const dispatch = useAppDispatch();
  const form = useFormRedux<CrisisManagementScenariosSchema>({
    resolver: zodResolver(crisisManagementScenariosSchema),
    values: defaultValues,
  });

  const handleCreateIdea = async (e: CrisisManagementScenariosSchema) => {
    try {
      const id = uniqueId();

      // 詳細なログ
      try {
        const response = await CrisisManagementScenarios(
          id,
          e.industry,
          e.businessSize,
          e.businessContent,
          e.selectedOptions,
          e.additionalContents,
          e.additionalConsiderations
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
    <div className={cn('h-full', className)}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleCreateIdea)} className="flex h-full flex-col">
          <div className="flex-1 space-y-3 overflow-y-auto pb-0">
            {/* 業界・業種入力フォーム */}
            <CrisisManagementScenariosIndustryArea />
            {/* 企業規模・拠点情報入力フォーム */}
            <CrisisManagementScenariosBusinessSizeArea />
            {/* シナリオを作成する業務内容入力フォーム */}
            <CrisisManagementScenariosBusinessContentArea />
            {/* リスクカテゴリ入力フォーム */}
            <RiskCategoryCheckArea
              control={form.control as unknown as Control<CrisisManagementScenariosState>}
            />
            {/* リスク内容入力フォーム */}
            <CrisisManagementScenariosAdditionalContentsArea />
            {/* アイデアの考慮事項入力フォーム */}
            <CrisisManagementScenariosConsiderationArea />
            {/* アイデア作成ボタン */}
            <CrisisManagementScenariosButton />
          </div>
        </form>
      </Form>
    </div>
  );
}
