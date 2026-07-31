'use server';

import { z } from 'zod';
import { Result } from '@/app/_types/result';
import { getMessage } from '@/app/_utils/message';
import { UseCase } from '../_type';
import { UseCaseSchema } from '../_utils/schema';

type Response = Result;

export async function updateUseCase(
  data: z.infer<typeof UseCaseSchema>,
  useCase: UseCase
): Promise<Response> {
  try {
    // TODO: CosmosDBとの連携を実装
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _data = data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _useCase = useCase;

    return {
      success: true,
      message: getMessage('I_F_00170', 'ユースケース'),
    };
  } catch (error) {
    console.error('Update use case error:', error);
    return {
      success: false,
      message: getMessage('E_F_00400', 'ユースケース'),
    };
  }
}
