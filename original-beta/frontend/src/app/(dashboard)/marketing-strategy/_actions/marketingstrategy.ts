'use server';

import { marketingstrategyDB } from '@/app/_db/marketingstrategy';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { marketingstrategyContainer } from '../../../../../cosmos';

type IdeaResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'idea'>;
};

type IdeaErrorResponse = {
  error: string;
};

export async function MarketingStrategy(
  id: string,
  MarketSize: string,
  GrowthRate: string,
  KeyPlayer: string,
  Competitors: string,
  CustomerAttributes: string,
  PurchasingBehavior: string
): Promise<IdeaResponse | IdeaErrorResponse> {
  const user = await getCurrentUser();
  try {
    console.log('バックエンドAPIリクエスト送信:', {
      MarketSize,
      GrowthRate,
      KeyPlayer,
      Competitors,
      CustomerAttributes,
      PurchasingBehavior,
    });

    const response = await useCaseAzureFunctions.sendJson<
      {
        MarketSize: string;
        GrowthRate: string;
        KeyPlayer: string;
        Competitors: string;
        CustomerAttributes: string;
        PurchasingBehavior: string;
      },
      IdeaResponse
    >('marketing-strategy', 'POST', {
      MarketSize,
      GrowthRate,
      KeyPlayer,
      Competitors,
      CustomerAttributes,
      PurchasingBehavior,
    });

    console.log('バックエンドAPIレスポンス受信:', response);

    // レスポンスデータのサイズをチェック
    try {
      const responseSize = Buffer.byteLength(JSON.stringify(response), 'utf8');
      console.log('応答データサイズ:', responseSize, 'bytes');
    } catch (sizeError) {
      console.error('サイズ計算エラー:', sizeError);
    }

    if (!response || !response.answer) {
      console.error('有効な回答がレスポンスに含まれていません:', response);
      return { error: getMessage('E_F_00110', '作成結果') };
    }

    // 応答を文字列として安全に処理
    const safeAnswer =
      typeof response.answer === 'string' ? response.answer : JSON.stringify(response.answer);

    // log
    try {
      await marketingstrategyDB(marketingstrategyContainer, {
        id,
        userId: user.id,
        useName: user.name,
        userEmail: user.email,
        userDepartmentName: user.departmentName,
        createdAt: new Date(),
        MarketSize,
        GrowthRate,
        KeyPlayer,
        Competitors,
        CustomerAttributes,
        PurchasingBehavior,
        outputForm: safeAnswer,
        log: response.log,
      });
    } catch (dbError) {
      console.error('データベース保存エラー:', dbError);
      // DBエラーでもフロントエンドには結果を返す
    }

    return {
      answer: safeAnswer,
      log: response.log,
    };
  } catch (error) {
    console.error('マーケティング戦略error 詳細:', error);

    if (error instanceof Error) {
      console.error('エラーメッセージ:', error.message);
      console.error('エラースタック:', error.stack);

      // バックエンドからのエラーメッセージを直接返す
      return { error: error.message };
    }
    return { error: getMessage('E_F_00110', '作成結果') };
  }
}
