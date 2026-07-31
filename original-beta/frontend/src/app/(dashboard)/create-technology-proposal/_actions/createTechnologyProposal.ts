'use server';

import { createTechnologyProposalDB } from '@/app/_db/create-technology-proposal';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { createTechnologyProposalContainer } from '../../../../../cosmos';

type TechnologyProposalResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'technologyProposal'>;
};

type TechnologyProposalErrorResponse = {
  error: string;
};

export async function createTechnologyProposal(
  id: string,
  technologyName: string,
  market: string,
  current_Issues: string,
  consideration?: string
): Promise<TechnologyProposalResponse | TechnologyProposalErrorResponse> {
  const user = await getCurrentUser();
  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        technologyName: string;
        market: string;
        current_Issues: string;
        consideration?: string;
      },
      TechnologyProposalResponse
    >('create-technology-proposal', 'POST', {
      technologyName,
      market,
      current_Issues,
      consideration,
    });

    // log
    await createTechnologyProposalDB(createTechnologyProposalContainer, {
      id,
      userId: user.id,
      useName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      createdAt: new Date(),
      technologyName,
      market,
      current_Issues,
      consideration,
      outputForm: response.answer,
      log: response.log,
    });

    return {
      answer: response.answer,
      log: response.log,
    };
  } catch (error) {
    console.error('Create technologyProposal error:', error);
    return { error: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果') };
  }
}
