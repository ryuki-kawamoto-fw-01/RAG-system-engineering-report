'use server';

import { newproductProposalDB } from '@/app/_db/new-product-proposal';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { newProductProposalContainer } from '../../../../../cosmos';

type NewProductProposalResponse = {
  answer: string;
};

export async function newproductProposal(
  id: string,
  productName: string,
  productMarket: string,
  targetCustomer: string,
  concept: string,
  comparisonPoints: string,
  consideration?: string
): Promise<NewProductProposalResponse> {
  const user = await getCurrentUser();

  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        productName: string;
        productMarket: string;
        targetCustomer: string;
        concept: string;
        comparisonPoints: string;
        consideration?: string;
      },
      NewProductProposalResponse
    >('new-product-proposal', 'POST', {
      productName,
      productMarket,
      targetCustomer,
      concept,
      comparisonPoints,
      consideration,
    });

    // log
    await newproductProposalDB(newProductProposalContainer, {
      id,
      userId: user.id,
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
    console.error('Create proposal error:', error);
    throw new Error(error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果'));
  }
}
