'use server';

import { productPromotionStrategyDB } from '@/app/_db/product-promotion-strategy';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { productPromotionStrategyContainer } from '../../../../../cosmos';
import type {
  ProductPromotionStrategyRequest,
  ProductPromotionStrategyResult,
} from '../_store/types';

type ProductPromotionStrategyResponse = {
  result: string;
  success: boolean;
  log: LLMserviceBackEndLog<'productPromotionStrategy'>;
};

export async function sendProductPromotionStrategyRequest(
  id: string,
  data: ProductPromotionStrategyRequest
): Promise<ProductPromotionStrategyResult> {
  const user = await getCurrentUser();

  try {
    const response = await useCaseAzureFunctions.sendJson<
      ProductPromotionStrategyRequest,
      ProductPromotionStrategyResponse
    >('product-promotion-strategy', 'POST', data);

    // エラーレスポンスのチェック
    if (!response.success) {
      throw new Error('バックエンドから失敗レスポンスが返されました');
    }

    // CosmosDBにログを保存
    await productPromotionStrategyDB(productPromotionStrategyContainer, {
      id,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      createdAt: new Date(),
      productDescription: data.productDescription,
      targetMarket: data.targetMarket,
      differentiationPoint: data.differentiationPoint,
      promotionTools: data.promotionTools,
      salesChannels: data.salesChannels,
      outputForm: response.result,
      log: response.log,
    });

    return {
      strategy: response.result,
    };
  } catch (error) {
    console.error('Failed to generate product promotion strategy:', error);
    throw new Error('拡販戦略の生成に失敗しました');
  }
}
