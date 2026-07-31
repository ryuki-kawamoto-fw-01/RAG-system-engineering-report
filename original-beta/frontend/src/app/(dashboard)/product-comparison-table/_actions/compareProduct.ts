'use server';

import { useCaseAzureFunctions } from '../../../../../azure-functions';

// レスポンスの型定義
type ApiResponse = {
  success: boolean;
  content?: string;
  message?: string;
  table?: {
    headers: string[];
    rows: string[][];
  };
};

// リクエストの型定義
type ApiRequest = {
  products: string[];
  purpose: string | FormDataEntryValue | null;
  considerations: string | FormDataEntryValue | null;
};

export async function CompareProduct(formData: FormData): Promise<ApiResponse> {
  try {
    // 製品の配列を取得
    const products: string[] = [];
    for (const [key, value] of formData.entries()) {
      if (
        key.startsWith('products[') &&
        key.endsWith(']') &&
        typeof value === 'string' &&
        value.trim()
      ) {
        products.push(value.trim());
      }
    }

    // 製品が存在しない場合のエラー処理
    if (products.length === 0) {
      return {
        success: false,
        message: '少なくとも1つの製品名を入力してください',
      };
    }

    // バックエンドのパラメータ名に合わせる
    // フォームデータから正しいパラメータ名で値を取得
    const purpose = formData.get('purpose') || '';
    const considerations = formData.get('additionalConsiderations') || '';

    // JSONデータとして送信（FormDataではなく）
    const jsonData: ApiRequest = {
      products,
      purpose,
      considerations,
    };

    // JSON形式でリクエスト送信（両方の型を指定）
    const response = await useCaseAzureFunctions.sendJson<ApiRequest, ApiResponse>(
      'product-comparison',
      'POST',
      jsonData
    );

    if (response && response.table) {
      // テーブル形式のデータをフロントエンド用に整形して返す
      return {
        success: true,
        content: JSON.stringify({ table: response.table }),
      };
    } else if (response && response.success) {
      return {
        success: true,
        content: JSON.stringify(response),
      };
    }
    return {
      success: false,
      message: response?.message || '製品比較表の作成に失敗しました',
    };
  } catch (error) {
    console.error('製品比較生成エラー:', error);

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
