'use server';

import { createBusinessPlanDB } from '@/app/_db/business-plan';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { businessPlanContainer } from '../../../../../cosmos';

export type BusinessPlanResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'businessPlan'>;
};

export type BusinessPlanErrorsResponse = {
  error: string;
};

// type Props = {
//   id: string;
//   businessName: string;
//   businessPurpose: string;
//   targetMarket: string;
//   businessModel: string;
//   competitiveAdvantage: string;
//   financialProjection: string;
//   newBusinessPlanRequest?: string;
// };

export async function createBusinessPlan(
  id: string,
  businessName: string,
  businessPurpose: string,
  targetMarket: string,
  businessModel: string,
  competitiveAdvantage: string,
  financialProjection: string
): Promise<BusinessPlanResponse | BusinessPlanErrorsResponse> {
  const user = await getCurrentUser();

  try {
    // const response = await useCaseAzureFunctions.sendJson<Props, BusinessPlanResponse>(
    //   'business_plan',
    //   'POST',
    //   props
    // );
    const response = await useCaseAzureFunctions.sendJson<
      {
        businessName: string;
        businessPurpose: string;
        targetMarket: string;
        businessModel: string;
        competitiveAdvantage: string;
        financialProjection: string;
      },
      BusinessPlanResponse
    >('business_plan', 'POST', {
      businessName,
      businessPurpose,
      targetMarket,
      businessModel,
      competitiveAdvantage,
      financialProjection,
    });

    // log
    await createBusinessPlanDB(businessPlanContainer, {
      id,
      userId: user.id,
      useName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      createdAt: new Date(),
      businessName,
      businessPurpose,
      targetMarket,
      businessModel,
      competitiveAdvantage,
      financialProjection,
      answer: response.answer,
      log: response.log,
    });

    return { answer: response.answer, log: response.log };
  } catch (error) {
    console.error('Error business plan analysis:', error);
    return { error: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果') };
  }
}
