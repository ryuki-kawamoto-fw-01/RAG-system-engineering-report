'use server';

import { createProductAARRRDB } from '@/app/_db/product-aarrr';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { productAARRRContainer } from '../../../../../cosmos';

type ProductAARRRResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'product-aarrr'>;
};

type ProductAARRRErrorResponse = {
  error: string;
};

export async function createProductAARRR(
  id: string,
  product_service: string,
  product_service_content: string,
  additionalConsiderations?: string
): Promise<ProductAARRRResponse | ProductAARRRErrorResponse> {
  const user = await getCurrentUser();
  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        product_service: string;
        product_service_content: string;
        additionalConsiderations?: string;
      },
      ProductAARRRResponse
    >('product-aarrr', 'POST', {
      product_service,
      product_service_content,
      additionalConsiderations,
    });

    await createProductAARRRDB(productAARRRContainer, {
      id,
      userId: user.id,
      useName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      createdAt: new Date(),
      product_service,
      product_service_content,
      additionalConsiderations,
      outputForm: response.answer,
      log: response.log,
    });

    return response;
  } catch (error) {
    console.error('product-aarrr error:', error);
    return {
      error: error instanceof Error ? error.message : getMessage('E_F_00070', 'product-aarrr'),
    };
  }
}
