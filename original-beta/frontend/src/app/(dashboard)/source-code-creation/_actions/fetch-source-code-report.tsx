'use server';

import { SourceCodeCreationResponse } from '@/app/_actions/types';
import { useCaseAzureFunctions } from '../../../../../azure-functions';

export async function fetchSourceCodeReport(
  formData: FormData
): Promise<SourceCodeCreationResponse> {
  try {
    const response = await useCaseAzureFunctions.sendForm<SourceCodeCreationResponse>(
      'create-source-code',
      formData
    );

    if (!response.success) {
      throw new Error('ソースコードの作成に失敗しました。');
    }

    return response;
  } catch (error) {
    console.error('Error in fetchCVEReport:', error);
    throw error;
  }
}
