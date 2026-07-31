'use server';

import { z } from 'zod';
import { Result } from '@/app/_types/result';
import { getMessage } from '@/app/_utils/message';
import { useCaseContainer } from '../../../../../cosmos';
import { UseCase } from '../_type';
import { UseCaseSchema } from '../_utils/schema';

type Response = Result;

export async function createUseCase(data: z.infer<typeof UseCaseSchema>): Promise<Response> {
  try {
    // 新しいユースケースオブジェクトを作成
    const newUseCase: Omit<UseCase, 'id'> = {
      status: data.status as UseCase['status'],
      value_proposition: (data.value_proposition || '') as UseCase['value_proposition'],
      business_domain: data.business_domain as UseCase['business_domain'],
      category: (data.category || '') as UseCase['category'],
      classification: data.classification as UseCase['classification'],
      use_case_name: data.use_case_name,
      overview: data.overview,
      origin: data.origin as UseCase['origin'],
      development_department: data.development_department as UseCase['development_department'],
      isDeleted: false,
    };

    // CosmosDBに保存
    await useCaseContainer.items.create(newUseCase);

    return {
      success: true,
      message: getMessage('I_F_00160', 'ユースケース'),
    };
  } catch (error) {
    console.error('Create use case error:', error);
    return {
      success: false,
      message: getMessage('E_F_00390', 'ユースケース'),
    };
  }
}
