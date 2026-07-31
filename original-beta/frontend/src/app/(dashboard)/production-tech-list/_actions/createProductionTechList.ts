'use server';

import { createProductionTechListDB } from '@/app/_db/production-tech-list';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { productionTechListContainer } from '../../../../../cosmos';

export type ProductionTechListResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'productionTechList'>;
};

export type ProductionTechListErrorsResponse = {
  error: string;
};

type Props = {
  id: string;
  category: string;
  focus: string;
  issues?: string;
  newProductionTechRequest?: string;
};

export async function createProductionTechList(
  props: Props
): Promise<ProductionTechListResponse | ProductionTechListErrorsResponse> {
  const user = await getCurrentUser();

  try {
    const response = await useCaseAzureFunctions.sendJson<Props, ProductionTechListResponse>(
      'production_tech',
      'POST',
      props
    );

    // log
    await createProductionTechListDB(productionTechListContainer, {
      userId: user.id,
      useName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      createdAt: new Date(),
      ...props,
      answer: response.answer,
      log: response.log,
    });

    return { answer: response.answer, log: response.log };
  } catch (error) {
    console.error('Error production tech list analysis:', error);
    return { error: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果') };
  }
}
