'use server';

import { mfgAzureFunctions } from '../../../../../azure-functions';
import { DesignDocumentReviewResponse } from '../type';

export async function checkProcs(
  checkCriteriaList: string[],
  designDocument: string,
  imageSrcData: string
): Promise<DesignDocumentReviewResponse> {
  try {
    const answerList = await mfgAzureFunctions.sendJson<object, string[]>(
      'designDocumentReview',
      'POST',
      { checkCriteriaList, designDocument, imageSrcData }
    );
    return { success: true, answerList };
  } catch (err) {
    return { success: false, message: JSON.stringify(err) };
  }
}
