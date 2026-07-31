'use server';

import { updateTechnologyProposalDB } from '@/app/_db/create-technology-proposal';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { createTechnologyProposalContainer } from '../../../../../cosmos';

type FixTechnologyProposalResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'technologyProposal'>;
};

type FixTechnologyProposalErrorResponse = {
  error: string;
};

export async function fixTechnologyProposal(
  result: string,
  modify: string,
  id: string
): Promise<FixTechnologyProposalResponse | FixTechnologyProposalErrorResponse> {
  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        result: string;
        modify: string;
      },
      FixTechnologyProposalResponse
    >('fix-technology-proposal', 'POST', {
      result,
      modify,
    });

    // log
    await updateTechnologyProposalDB(createTechnologyProposalContainer, {
      id,
      createdAt: new Date(),
      result,
      modify,
      outputForm: response.answer,
      log: response.log,
    });
    return {
      answer: response.answer,
      log: response.log,
    };
  } catch (error) {
    console.error('Fix technologyProposal error:', error);
    return { error: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果') };
  }
}
