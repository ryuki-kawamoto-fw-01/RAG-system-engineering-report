'use server';

import { useCaseAzureFunctions } from '../../../../../azure-functions';

type NewProductNameResponse = {
  answer: string;
};

export async function createNewProductName(
  result: string,
  newproductnameRequest: string
): Promise<NewProductNameResponse> {
  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        result: string;
        newproductnameRequest: string;
      },
      NewProductNameResponse
    >('create-new-productname', 'POST', {
      result,
      newproductnameRequest,
    });
    return {
      answer: response.answer,
    };
  } catch (error) {
    console.error('Create new product name error:', error);
    throw new Error('追加の製品ネーミングの作成中にエラーが発生しました');
  }
}
