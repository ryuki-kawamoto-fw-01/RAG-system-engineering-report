'use server';

import { createSupposedQuestionDB } from '@/app/_db/supposed-question';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { Result } from '@/app/_types/result';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { supposedQuestionContainer } from '../../../../../cosmos';
import { SupposedQuestionErrors } from '../_type';

type Response = Result<SupposedQuestionErrors> & {
  content?: string;
  temp_file?: string;
  log?: LLMserviceBackEndLog<'supposedQuestion'>;
};

export async function createSupposedQuestion(id: string, formData: FormData): Promise<Response> {
  const user = await getCurrentUser();
  try {
    // FormDataからJSONボディを作成
    const body = {
      description: formData.get('description') as string,
      consideration: formData.get('consideration') as string,
      specialty: parseInt(formData.get('specialty') as string, 10),
      interest: parseInt(formData.get('interest') as string, 10),
      intimacy: parseInt(formData.get('intimacy') as string, 10),
      file: JSON.parse((formData.get('file') as string) || '[]'), // FileReference[]
    };

    const answerResponse = await useCaseAzureFunctions.sendJson<typeof body, Response>(
      'supposed-question',
      'POST',
      body
    );

    // 成功時の処理
    if (answerResponse.success) {
      // log
      await createSupposedQuestionDB(supposedQuestionContainer, {
        id,
        userId: user.id,
        useName: user.name,
        userEmail: user.email,
        userDepartmentName: user.departmentName,
        createdAt: new Date(),
        description: body.description,
        specialty: body.specialty.toString(),
        interest: body.interest.toString(),
        intimacy: body.intimacy.toString(),
        inputForm: answerResponse.temp_file as string,
        outputForm: answerResponse.content as string,
        log: answerResponse.log,
      });
      return {
        content: answerResponse.content,
        temp_file: answerResponse.temp_file,
        success: true,
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
    return {
      message: answerResponse.message || getMessage('E_F_00110', '作成結果'),
      success: false,
    };
  } catch (error) {
    console.error('Error creating supposed question:', error);
    return {
      message: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果'),
      success: false,
    };
  }
}
