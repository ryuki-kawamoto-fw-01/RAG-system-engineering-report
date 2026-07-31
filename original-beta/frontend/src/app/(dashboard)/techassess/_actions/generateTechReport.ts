'use server';

// 正しいパスに修正
import { techassessDB } from '@/app/_db/techassess';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { techassessContainer } from '../../../../../cosmos';

// レスポンスの型定義
type ApiResponse = {
  success: boolean;
  results?: {
    content?: string;
  };
  message?: string;
  log?: LLMserviceBackEndLog<'techassess'>;
};

// 技術評価レポート用リクエスト型
type ApiRequest = {
  field: string;
  region: string;
  companySize: string;
  industryIssues: string;
  granularity: string;
  purpose: string;
};

// 技術評価レポート生成API
export async function generateTechReport(id: string, data: ApiRequest): Promise<ApiResponse> {
  const user = await getCurrentUser();
  try {
    if (
      !data.field.trim() ||
      !data.region.trim() ||
      !data.industryIssues.trim() ||
      !data.granularity.trim() ||
      !data.purpose.trim()
    ) {
      return {
        success: false,
        message: '全ての必須項目を入力してください',
      };
    }

    // ログ追加
    console.log('API呼び出し前のデータ:', JSON.stringify(data));
    const response = await useCaseAzureFunctions.sendJson<ApiRequest, ApiResponse>(
      'techassess-report',
      'POST',
      data
    );
    console.log('APIレスポンス (raw):', response);

    if (response && response.success) {
      // log
      await techassessDB(techassessContainer, {
        id,
        userId: user.id,
        useName: user.name,
        userEmail: user.email,
        userDepartmentName: user.departmentName,
        createdAt: new Date(),
        field: data.field,
        region: data.region,
        companySize: data.companySize,
        industryIssues: data.industryIssues,
        granularity: data.granularity,
        purpose: data.purpose,
        outputForm: response.results?.content || '',
        log: response.log!,
      });

      return response;
    }
    return {
      success: false,
      message: response?.message || '技術評価レポートの作成に失敗しました',
    };
  } catch (error) {
    console.error('Create techassess report error:', error);
    let errorMessage = 'サーバー処理中にエラーが発生しました';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      success: false,
      message: errorMessage,
    };
  }
}
