'use server';

import { updateSupposedQuestionDB } from '@/app/_db/supposed-question';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { Result } from '@/app/_types/result';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { supposedQuestionContainer } from '../../../../../cosmos';
import { ModifiedSupposedQuestionErrors } from '../_type';

type Response = Result<ModifiedSupposedQuestionErrors> & {
  content?: string;
  log?: LLMserviceBackEndLog<'supposedQuestion'>;
};

export async function modifySupposedQuestion(formData: FormData, id: string): Promise<Response> {
  try {
    const answerResponse = await useCaseAzureFunctions.sendForm<Response>(
      'modify-supposed-question',
      formData
    );

    // 成功時の処理
    if (answerResponse.success) {
      // log
      await updateSupposedQuestionDB(supposedQuestionContainer, {
        id,
        createdAt: new Date(),
        description: formData.get('description') as string,
        qa_list: formData.get('qa_list') as string,
        outputForm: answerResponse.content as string,
        log: answerResponse.log,
      });
      return {
        content: answerResponse.content,
        success: true,
        log: answerResponse.log,
      };
    }

    // 正規表現を使ってJSON部分を抽出
    const jsonRegex = /\{[\s\S]*\}/; // 波括弧から始まり波括弧で終わる部分を抽出
    const jsonMatch = answerResponse.message?.match(jsonRegex);

    if (jsonMatch) {
      const errorObj = JSON.parse(jsonMatch[0]);
      // エラー時
      return {
        success: false,
        message: errorObj.error_message || getMessage('E_F_00110', '作成結果'),
      };
    }
    // エラー時の処理
    return {
      message: answerResponse.message || getMessage('E_F_00110', '作成結果'),
      success: false,
    };
  } catch (error) {
    console.error('Error modifying supposed question:', error);
    return {
      message: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果'),
      success: false,
    };
  }
}
