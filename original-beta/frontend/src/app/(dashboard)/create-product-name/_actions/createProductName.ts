'use server';

import { useCaseAzureFunctions } from '../../../../../azure-functions';

//import { createProductNameDB } from '@/app/_db/product-name';
//import { getCurrentUser } from '@/app/_utils/auth';
//import { createProductNameContainer } from '../../../../../cosmos';

type ProductNameResponse = {
  answer: string;
};

export async function createProductName(
  id: string,
  productnameSubject: string,
  productnameRole: string,
  productnameConvention: string
): Promise<ProductNameResponse> {
  // const user = getCurrentUser();
  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        productnameSubject: string;
        productnameRole: string;
        productnameConvention: string;
      },
      ProductNameResponse
    >('create-productname', 'POST', {
      productnameSubject,
      productnameRole,
      productnameConvention,
    });

    /*
      // log
      await createProductNameDB(createProductNameContainer, {
        id,
        userId: user.id,
        createdAt: new Date(),
        title: undefined,
        inputForm: productnameSubject,
        positionForm: productnameRole,
        conventionForm: productnameConvention,
        outputForm: response.answer,
      });
  */
    return {
      answer: response.answer,
    };
  } catch (error) {
    console.error('Create product name error:', error);
    throw new Error('ネーミングの作成中にエラーが発生しました');
  }
}
