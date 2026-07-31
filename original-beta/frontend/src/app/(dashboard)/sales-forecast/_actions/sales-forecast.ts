'use server';

import { AzureResponse, ErrorResponse } from '@/app/_actions/types';
import { createSalesForecastDB } from '@/app/_db/sales-forecast';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { salesForecastContainer } from '../../../../../cosmos';

// 返り値の型定義
export type SalesForecastResponse =
  | {
      content: string;
      success: true;
    }
  | ErrorResponse;

// API呼び出し
export async function salesForecast(
  id: string,
  productName: string,
  productCategory: string[],
  features: string,
  useCase: string,
  analysisPriorities: string[],
  targetIndustry: string[],
  targetCustomers: string[],
  targetRegions: string[],
  marketData: string,
  competingProducts: string
): Promise<SalesForecastResponse> {
  const user = await getCurrentUser();

  try {
    // Azure FunctionsへのAPIリクエスト
    const response = await useCaseAzureFunctions.sendJson<
      {
        productName: string;
        productCategory: string[];
        features: string;
        useCase: string;
        analysisPriorities: string[];
        targetIndustry: string[];
        targetCustomers: string[];
        targetRegions: string[];
        marketData: string;
        competingProducts: string;
      },
      AzureResponse & { log: LLMserviceBackEndLog<'salesForecast'> }
    >('sales-forecast', 'POST', {
      productName,
      productCategory,
      features,
      useCase,
      analysisPriorities,
      targetIndustry,
      targetCustomers,
      targetRegions,
      marketData,
      competingProducts,
    });

    if (response.success) {
      await createSalesForecastDB(salesForecastContainer, {
        id,
        userId: user.id,
        useName: user.name,
        userEmail: user.email,
        userDepartmentName: user.departmentName,
        createdAt: new Date(),
        productName,
        productCategory,
        features,
        useCase,
        analysisPriorities,
        targetIndustry,
        targetCustomers,
        targetRegions,
        marketData,
        competingProducts,
        outputForm: response.answer,
        log: response.log,
      });
      // 成功時の処理
      return {
        success: true,
        content: response.answer,
      };
    }
    //失敗時の処理
    return {
      message: response.message,
      success: false,
    };
  } catch (error) {
    console.error('Error salesForecast:', error);
    return {
      message: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果'),
      success: false,
    };
  }
}
