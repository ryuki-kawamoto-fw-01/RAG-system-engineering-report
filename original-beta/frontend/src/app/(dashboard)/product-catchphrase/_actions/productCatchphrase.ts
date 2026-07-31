'use server';

import { productCatchphraseDB } from '@/app/_db/catchphrase';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { productCatchphraseContainer } from '../../../../../cosmos';

type CatchphraseResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'catchphrase'>;
};

type CatchphraseErrorResponse = {
  error: string;
};

export async function productCatchphrase(
  id: string,
  formData: FormData,
  selectedTab: string
): Promise<CatchphraseResponse | CatchphraseErrorResponse> {
  const user = await getCurrentUser();
  try {
    const response = await useCaseAzureFunctions.sendForm<
      CatchphraseResponse & { temp_file?: string }
    >('product-catchphrase', formData);

    // log
    await productCatchphraseDB(productCatchphraseContainer, {
      id,
      userId: user.id,
      type: selectedTab,
      useName: user.name,
      userEmail: user.email,
      userDepartmentName: user.departmentName,
      createdAt: new Date(),
      productName: formData.get('productName') as string,
      productInformation: formData.get('productInformation') as string,
      targetCustomer: formData.get('targetCustomer') as string,
      competitor: formData.get('competitor') as string,
      consideration: formData.get('consideration') as string,
      fileConsideration: formData.get('fileConsideration') as string,
      outputForm: response.answer,
      log: response.log,
    });

    return {
      answer: response.answer,
      log: response.log,
    };
  } catch (error) {
    console.error('Create catchphrase error:', error);
    return { error: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果') };
  }
}
