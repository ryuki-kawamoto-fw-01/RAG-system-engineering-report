'use server';

import { updatemarketresearchReportDB } from '@/app/_db/market-research';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { marketresearchContainer } from '../../../../../cosmos';

type FixReportResponse = {
  answer: string;
};

type FixReportErrorResponse = {
  error: string;
};

export async function FixMarketReport(
  id: string,
  result: string,
  prev_market: string,
  prev_competitor: string,
  prev_target: string,
  prev_purpose: string,
  market: string,
  competitor: string,
  target: string,
  purpose: string,
  prev_consideration?: string,
  consideration?: string
): Promise<FixReportResponse | FixReportErrorResponse> {
  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        result: string;
        prev_market: string;
        prev_competitor: string;
        prev_target: string;
        prev_purpose: string;
        market: string;
        competitor: string;
        target: string;
        purpose: string;
        prev_consideration?: string;
        consideration?: string;
      },
      FixReportResponse
    >('fix-market-report', 'POST', {
      result,
      prev_market,
      prev_competitor,
      prev_target,
      prev_purpose,
      market,
      competitor,
      target,
      purpose,
      prev_consideration,
      consideration,
    });

    // log
    await updatemarketresearchReportDB(marketresearchContainer, {
      id,
      createdAt: new Date(),
      title: undefined,
      marketForm: market,
      competitorForm: competitor,
      targetForm: target,
      purposeForm: purpose,
      considerationForm: consideration ?? '',
      outputForm: response.answer,
    });
    return {
      answer: response.answer,
    };
  } catch (error) {
    console.error('Fix report error:', error);

    if (error instanceof Error) {
      // 正規表現を使ってJSON部分を抽出
      const jsonRegex = /\{[\s\S]*\}/; // 波括弧から始まり波括弧で終わる部分を抽出
      const jsonMatch = error.message.match(jsonRegex);

      if (jsonMatch) {
        const errorObj = JSON.parse(jsonMatch[0]);
        return { error: errorObj.error_message };
      }
    }
    return { error: 'レポートの修正中にエラーが発生しました' };
  }
}
