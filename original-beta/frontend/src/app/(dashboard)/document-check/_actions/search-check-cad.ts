'use server';

import { mfgAzureFunctions } from '../../../../../azure-functions';
import { SearchCheckCadResponse } from '../type';

export async function searchCheckCad(
  searchWord: string,
  checkCandidateCount: number
): Promise<SearchCheckCadResponse> {
  try {
    const response = await mfgAzureFunctions.sendJson<object, SearchCheckCadResponse>(
      'documentSearch',
      'POST',
      { searchWord, checkCandidateCount }
    );
    return response;
  } catch (err) {
    return { success: false, message: JSON.stringify(err) };
  }
}
