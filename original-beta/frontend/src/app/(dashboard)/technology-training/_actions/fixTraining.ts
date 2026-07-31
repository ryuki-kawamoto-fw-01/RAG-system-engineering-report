'use server';

import { updateTechnologyTrainingDB } from '@/app/_db/technology-training';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { technologyTrainingContainer } from '../../../../../cosmos';

type FixTrainingResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'training'>;
};

type FixTrainingErrorResponse = {
  error: string;
};

export async function FixTraining(
  result: string,
  fixTrainingRequest: string,
  id: string
): Promise<FixTrainingResponse | FixTrainingErrorResponse> {
  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        result: string;
        fixTrainingRequest: string;
      },
      FixTrainingResponse
    >('fix-training', 'POST', {
      result,
      fixTrainingRequest,
    });

    // log
    await updateTechnologyTrainingDB(technologyTrainingContainer, {
      id,
      createdAt: new Date(),
      fixTrainingRequest,
      outputForm: response.answer,
      log: response.log,
    });
    return {
      answer: response.answer,
      log: response.log,
    };
  } catch (error) {
    console.error('Fix training error:', error);
    return { error: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果') };
  }
}
