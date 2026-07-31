'use server';

import { createIdeaDB } from '@/app/_db/product-service-benefit-idea';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { productServiceBenefitIdeaContainer } from '../../../../../cosmos';

type IdeaResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'idea'>;
};

type IdeaErrorResponse = {
  error: string;
};

export async function createIdea(
  id: string,
  Product: string,
  Features: string,
  Consideration?: string
): Promise<IdeaResponse | IdeaErrorResponse> {
  const user = await getCurrentUser();
  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        Product: string;
        Features: string;
        Consideration?: string;
      },
      IdeaResponse
    >('product-service-benefit-idea', 'POST', {
      Product,
      Features,
      Consideration,
    });

    // log
    await createIdeaDB(productServiceBenefitIdeaContainer, {
      id,
      userId: user.id,
      useName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      createdAt: new Date(),
      Product,
      Features,
      Consideration,
      outputForm: response.answer,
      log: response.log,
    });

    return {
      answer: response.answer,
      log: response.log,
    };
  } catch (error) {
    console.error('Create idea error:', error);
    return { error: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果') };
  }
}
