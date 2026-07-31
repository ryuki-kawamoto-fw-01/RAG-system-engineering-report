'use server';

import { AzureResponse, ErrorResponse } from '@/app/_actions/types';
import { updateSalesForecastDB } from '@/app/_db/sales-forecast';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { salesForecastContainer } from '../../../../../cosmos';

export type SalesForecastResponse =
  | {
      content: string;
      success: true;
    }
  | ErrorResponse;

export async function fixSalesForecast(
  result: string,
  revisionPrompt: string,
  id: string
): Promise<SalesForecastResponse> {
  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        result: string;
        revisionPrompt: string;
      },
      AzureResponse & { log: LLMserviceBackEndLog<'salesForecast'> }
    >('fix-sales-forecast', 'POST', {
      result,
      revisionPrompt,
    });

    if (response.success) {
      // log
      await updateSalesForecastDB(salesForecastContainer, {
        id,
        revisionPrompt,
        outputForm: response.answer,
        log: response.log,
      });
      return {
        success: true,
        content: response.answer,
      };
    }
    return {
      success: false,
      message: response.message,
    };
  } catch (error) {
    console.error('Error salesForecast:', error);

    return {
      success: false,
      message: error instanceof Error ? error.message : 'エラーが発生しました。',
    };
  }
}
