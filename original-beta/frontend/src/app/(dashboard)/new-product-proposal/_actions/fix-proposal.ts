'use server';

import { updateproductProposalDB } from '@/app/_db/new-product-proposal';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { newProductProposalContainer } from '../../../../../cosmos';

type FixProposalResponse = {
  answer: string;
};

type FixProposalErrorResponse = {
  error: string;
};

export async function FixProductProposal(
  id: string,
  result: string,
  prev_product_name: string,
  prev_product_market: string,
  prev_target: string,
  prev_concept: string,
  prev_comparison_points: string,
  productName: string,
  productMarket: string,
  targetCustomer: string,
  concept: string,
  comparisonPoints: string,
  prev_consideration?: string,
  consideration?: string
): Promise<FixProposalResponse | FixProposalErrorResponse> {
  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        result: string;
        prev_product_name: string;
        prev_product_market: string;
        prev_target: string;
        prev_concept: string;
        prev_comparison_points: string;
        productName: string;
        productMarket: string;
        targetCustomer: string;
        concept: string;
        comparisonPoints: string;
        prev_consideration?: string;
        consideration?: string;
      },
      FixProposalResponse
    >('fix-product-proposal', 'POST', {
      result,
      prev_product_name,
      prev_product_market,
      prev_target,
      prev_concept,
      prev_comparison_points,
      productName,
      productMarket,
      targetCustomer,
      concept,
      comparisonPoints,
      prev_consideration,
      consideration,
    });

    // log
    await updateproductProposalDB(newProductProposalContainer, {
      id,
      createdAt: new Date(),
      title: undefined,
      nameForm: productName,
      marketForm: productMarket,
      targetForm: targetCustomer,
      conceptForm: concept,
      comparisonPointsForm: comparisonPoints,
      considerationForm: consideration ?? '',
      outputForm: response.answer,
    });
    return {
      answer: response.answer,
    };
  } catch (error) {
    console.error('Fix proposal error:', error);

    if (error instanceof Error) {
      // 正規表現を使ってJSON部分を抽出
      const jsonRegex = /\{[\s\S]*\}/; // 波括弧から始まり波括弧で終わる部分を抽出
      const jsonMatch = error.message.match(jsonRegex);

      if (jsonMatch) {
        const errorObj = JSON.parse(jsonMatch[0]);
        return { error: errorObj.error_message };
      }
    }
    return { error: '企画書の修正中にエラーが発生しました' };
  }
}
