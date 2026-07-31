'use server';

import { Result } from '@/app/_types/result';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { SummaryErrors } from '../_type';

type RequestBody = {
  domain: string;
  content: string;
  consideration: string;
};

type Response = Result<SummaryErrors> & {
  term_summary_result?: string;
  term_explanation?: string;
};

export async function createTermSummary(body: RequestBody): Promise<Response> {
  try {
    const answerResponse = await useCaseAzureFunctions.sendJson<RequestBody, Response>(
      'term-summary',
      'POST',
      body
    );

    if (!answerResponse.success) {
      return {
        message: '要約の作成中にエラーが発生しました',
        success: false,
      };
    }

    return {
      term_summary_result: answerResponse.term_summary_result,
      term_explanation: answerResponse.term_explanation,
      success: true,
    };
  } catch (error) {
    console.error('Create summary error:', error);
    throw new Error('要約の作成中にエラーが発生しました');
  }
}
