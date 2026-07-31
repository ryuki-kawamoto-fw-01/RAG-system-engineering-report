'use server';

import { marketresearchReportDB } from '@/app/_db/market-research';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { marketresearchContainer } from '../../../../../cosmos';

type MarketResearchResponse = {
  answer: string;
};

export async function marketresearchReport(
  id: string,
  market: string,
  competitor: string,
  targetCustomer: string,
  purpose: string,
  consideration?: string
): Promise<MarketResearchResponse> {
  const user = await getCurrentUser();

  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        market: string;
        competitor: string;
        targetCustomer: string;
        purpose: string;
        consideration?: string;
      },
      MarketResearchResponse
    >('market-research-report', 'POST', {
      market,
      competitor,
      targetCustomer,
      purpose,
      consideration,
    });

    // log
    await marketresearchReportDB(marketresearchContainer, {
      id,
      userId: user.id,
      createdAt: new Date(),
      title: undefined,
      marketForm: market,
      competitorForm: competitor,
      targetForm: targetCustomer,
      purposeForm: purpose,
      considerationForm: consideration ?? '',
      outputForm: response.answer,
    });

    return {
      answer: response.answer,
    };
  } catch (error) {
    console.error('Create report error:', error);
    throw new Error(error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果'));
  }
}
