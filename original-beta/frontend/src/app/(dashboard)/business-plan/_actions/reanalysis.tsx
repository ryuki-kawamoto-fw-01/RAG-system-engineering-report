'use server';

import { updateBusinessPlanDB } from '@/app/_db/business-plan';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { businessPlanContainer } from '../../../../../cosmos';

type ReanalysisResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'businessPlan'>;
};

export type ReanalysisErrorResponse = {
  error: string;
};

// type Props = {
//   newBusinessPlanRequest: string;
//   result: string;
//   id: string;
// };

export async function reanalysis(
  id: string,
  result: string,
  newBusinessPlanRequest: string
): Promise<ReanalysisResponse | ReanalysisErrorResponse> {
  try {
    // const response = await useCaseAzureFunctions.sendJson<Props, ReanalysisResponse>(
    //   'new_business_plan',
    //   'POST',
    //   props
    // );
    const response = await useCaseAzureFunctions.sendJson<
      {
        result: string;
        newBusinessPlanRequest: string;
      },
      ReanalysisResponse
    >('new_business_plan', 'POST', {
      result,
      newBusinessPlanRequest,
    });

    // レスポンスが空や不正な場合に備える
    if (!response || typeof response !== 'object' || !('answer' in response)) {
      return { error: 'サーバーから正しいデータが返りませんでした' };
    }

    await updateBusinessPlanDB(businessPlanContainer, {
      id,
      createdAt: new Date(),
      newBusinessPlanRequest,
      answer: response.answer,
      log: response.log,
    });

    return { answer: response.answer, log: response.log };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error business plan analysis3:', error.message);

      // 正規表現を使ってJSON部分を抽出
      const jsonRegex = /\{[\s\S]*\}/;
      const jsonMatch = error.message.match(jsonRegex);

      if (jsonMatch) {
        try {
          const errorObj = JSON.parse(jsonMatch[0]);
          return { error: errorObj.error_message };
        } catch {
          // JSONパースに失敗した場合
          return { error: 'サーバーから不正なエラー情報が返されました' };
        }
      }
    }
    console.error('Error business plan analysis4:', String(error));
    return { error: String(error) };
  }
}
