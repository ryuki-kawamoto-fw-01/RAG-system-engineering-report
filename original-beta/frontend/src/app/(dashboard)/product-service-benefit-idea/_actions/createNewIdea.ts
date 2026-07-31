'use server';

import { updateIdeaDB } from '@/app/_db/product-service-benefit-idea';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { productServiceBenefitIdeaContainer } from '../../../../../cosmos';

type NewIdeaResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'idea'>;
};

type NewIdeaErrorResponse = {
  error: string;
};

export async function createNewIdea(
  result: string,
  newIdeaRequest: string,
  id: string
): Promise<NewIdeaResponse | NewIdeaErrorResponse> {
  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        result: string;
        newIdeaRequest: string;
      },
      NewIdeaResponse
    >('product-service-benefit-new-idea', 'POST', {
      result,
      newIdeaRequest,
    });

    // log
    await updateIdeaDB(productServiceBenefitIdeaContainer, {
      id,
      createdAt: new Date(),
      newIdeaRequest,
      outputForm: response.answer,
      log: response.log,
    });
    return {
      answer: response.answer,
      log: response.log,
    };
  } catch (error) {
    console.error('Create new idea error:', error);
    return { error: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果') };
  }
}
