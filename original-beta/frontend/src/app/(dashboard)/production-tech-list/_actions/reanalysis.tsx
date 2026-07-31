'use server';

// 202509081112

import { updateProductionTechListDB } from '@/app/_db/production-tech-list';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { productionTechListContainer } from '../../../../../cosmos';

type ReanalysisResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'productionTechList'>;
};

export type ReanalysisErrorResponse = {
  error: string;
};

type Props = {
  newProductionTechRequest: string;
  result: string;
  id: string;
};

export async function reanalysis(
  props: Props
): Promise<ReanalysisResponse | ReanalysisErrorResponse> {
  try {
    const response = await useCaseAzureFunctions.sendJson<Props, ReanalysisResponse>(
      'new_production_tech',
      'POST',
      props
    );

    // レスポンスが空や不正な場合に備える
    if (!response || typeof response !== 'object' || !('answer' in response)) {
      return { error: 'サーバーから正しいデータが返りませんでした' };
    }

    await updateProductionTechListDB(productionTechListContainer, {
      createdAt: new Date(),
      ...props,
      answer: response.answer,
      log: response.log,
    });

    return { answer: response.answer, log: response.log };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error production tech list analysis3:', error.message);

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
    console.error('Error production tech list analysis4:', String(error));
    return { error: String(error) };
  }
}
