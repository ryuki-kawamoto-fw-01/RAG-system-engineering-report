'use server';

import { AzureResponse } from '@/app/_actions/types';
import { troubleShootingGuideDB } from '@/app/_db/trouble-shooting-guide';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { troubleShootingGuideContainer } from '../../../../../cosmos';

type TroubleShootingResponse = {
  result: string;
  log: LLMserviceBackEndLog<'troubleShooting'>;
};

type TroubleShootingErrorResponse = {
  error: string;
};

// トラブルシューティングガイド作成
export async function createTroubleShootingGuide(
  id: string,
  formData: FormData,
  selectedTab: string
): Promise<TroubleShootingResponse | TroubleShootingErrorResponse> {
  const user = await getCurrentUser();
  try {
    const answerResponse = await useCaseAzureFunctions.sendForm<
      AzureResponse & {
        answer: string;
        log: LLMserviceBackEndLog<'troubleShooting'>;
      }
    >('trouble-shooting-guide', formData);

    // log
    await troubleShootingGuideDB(troubleShootingGuideContainer, {
      id,
      userId: user.id,
      useName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      type: selectedTab,
      createdAt: new Date(),
      productSpecification: formData.get('productSpecification') as string,
      productName: formData.get('productName') as string,
      productPurpose: formData.get('productPurpose') as string,
      outputForm: answerResponse.answer,
      log: answerResponse.log,
    });

    return {
      result: answerResponse.answer,
      log: answerResponse.log,
    };
  } catch (error) {
    console.error('Error creating trouble shooting guide:', error);
    return {
      error: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果'),
    };
  }
}
