'use server';

import { Result } from '@/app/_types/result';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { FaqCreationErrors } from '../_type';

type Response = Result<FaqCreationErrors> & {
  content?: string;
};

export async function createFaq(formData: FormData): Promise<Response> {
  try {
    const answerResponse = await useCaseAzureFunctions.sendForm<Response>('faq-creation', formData);

    // 成功時の処理
    if (answerResponse.success) {
      return {
        content: answerResponse.content,
        success: true,
      };
    }

    return {
      message: answerResponse.message || 'エラーが発生しました。',
      success: false,
    };
  } catch (error) {
    // キャッチされたエラーを処理
    console.error('Error creating supposed question:', error);

    let errorMessage = 'エラーが発生しました。';

    if (error instanceof Error) {
      // 正規表現を使ってJSON部分を抽出
      const jsonRegex = /\{[\s\S]*\}/; // 波括弧から始まり波括弧で終わる部分を抽出
      const jsonMatch = error.message.match(jsonRegex);

      if (jsonMatch) {
        try {
          const errorObj = JSON.parse(jsonMatch[0]);
          if (errorObj.message) {
            // エラーオブジェクトのmessageプロパティを抽出
            errorMessage = errorObj.message;
          } else {
            errorMessage = error.message;
          }
        } catch (parseError) {
          // JSONパースに失敗した場合
          console.error('Failed to parse JSON from error message:', parseError);
          errorMessage = error.message;
        }
      } else {
        // JSON部分が見つからなかった場合
        errorMessage = error.message;
      }
    } else {
      // errorがErrorインスタンスでない場合
      errorMessage = String(error);
    }

    return {
      message: errorMessage,
      success: false,
    };
  }
}
