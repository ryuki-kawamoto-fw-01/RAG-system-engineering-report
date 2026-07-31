'use server';

import { productPromotionStrategyDB } from '@/app/_db/product-promotion-strategy';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { productPromotionStrategyContainer } from '../../../../../cosmos';

type ProductPromotionStrategyResponse = {
  result: string;
  success: boolean;
  log: LLMserviceBackEndLog<'productPromotionStrategy'>;
};

type ProductPromotionStrategyErrorResponse = {
  error: string;
};

export async function createProductPromotionStrategy(
  id: string,
  productDescription: string,
  targetMarket: string,
  differentiationPoint: string,
  promotionTools: string,
  salesChannels: string
): Promise<ProductPromotionStrategyResponse | ProductPromotionStrategyErrorResponse> {
  const user = await getCurrentUser();
  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        productDescription: string;
        targetMarket: string;
        differentiationPoint: string;
        promotionTools: string;
        salesChannels: string;
      },
      ProductPromotionStrategyResponse
    >('product-promotion-strategy', 'POST', {
      productDescription,
      targetMarket,
      differentiationPoint,
      promotionTools,
      salesChannels,
    });

    // CosmosDBにログを保存
    await productPromotionStrategyDB(productPromotionStrategyContainer, {
      id,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      productDescription,
      targetMarket,
      differentiationPoint,
      promotionTools,
      salesChannels,
      createdAt: new Date(),
      outputForm: response.result,
      log: response.log,
    });

    return response;
  } catch (error) {
    console.error('Error creating product promotion strategy:', error);
    return {
      error: error instanceof Error ? error.message : getMessage('E_F_00110', '製品の拡販戦略'),
    };
  }
}
