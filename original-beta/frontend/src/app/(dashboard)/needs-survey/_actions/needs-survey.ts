'use server';

import { needsSurveyDB } from '@/app/_db/needs-survey';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { needsSurveyContainer } from '../../../../../cosmos';

type IdeaResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'idea'>;
};

type IdeaErrorResponse = {
  error: string;
};

export async function NeedsSurvey(
  id: string,
  industry: string,
  purpose: string,
  product: string,
  persona?: string,
  additionalConsiderations?: string
): Promise<IdeaResponse | IdeaErrorResponse> {
  const user = await getCurrentUser();
  try {
    console.log('バックエンドAPIリクエスト送信:', {
      industry,
      purpose,
      product,
      persona,
      additionalConsiderations,
    });

    const response = await useCaseAzureFunctions.sendJson<
      {
        industry: string;
        purpose: string;
        product: string;
        persona?: string;
        additionalConsiderations?: string;
      },
      IdeaResponse
    >('needs-survey', 'POST', {
      industry,
      purpose,
      product,
      persona,
      additionalConsiderations,
    });

    console.log('バックエンドAPIレスポンス受信:', response);

    // レスポンスデータのサイズをチェック
    try {
      const responseSize = Buffer.byteLength(JSON.stringify(response), 'utf8');
      console.log('応答データサイズ:', responseSize, 'bytes');
    } catch (sizeError) {
      console.error('サイズ計算エラー:', sizeError);
    }

    if (!response || !response.answer) {
      console.error('有効な回答がレスポンスに含まれていません:', response);
      return { error: getMessage('E_F_00110', '作成結果') };
    }

    // 応答を文字列として安全に処理
    const safeAnswer =
      typeof response.answer === 'string' ? response.answer : JSON.stringify(response.answer);

    // log
    try {
      await needsSurveyDB(needsSurveyContainer, {
        id,
        userId: user.id,
        useName: user.name,
        userEmail: user.email,
        userDepartmentName: user.departmentName,
        createdAt: new Date(),
        industry,
        purpose,
        product,
        persona,
        additionalConsiderations,
        outputForm: safeAnswer,
        log: response.log,
      });
    } catch (dbError) {
      console.error('データベース保存エラー:', dbError);
      // DBエラーでもフロントエンドには結果を返す
    }

    return {
      answer: safeAnswer,
      log: response.log,
    };
  } catch (error) {
    console.error('error 詳細:', error);

    if (error instanceof Error) {
      console.error('エラーメッセージ:', error.message);
      console.error('エラースタック:', error.stack);

      // 正規表現を使ってJSON部分を抽出
      const jsonRegex = /\{[\s\S]*\}/; // 波括弧から始まり波括弧で終わる部分を抽出
      const jsonMatch = error.message.match(jsonRegex);

      if (jsonMatch) {
        try {
          const errorObj = JSON.parse(jsonMatch[0]);
          return { error: errorObj.error_message };
        } catch (parseError) {
          console.error('JSONパースエラー:', parseError);
        }
      }
    }
    return { error: getMessage('E_F_00110', '作成結果') };
  }
}

// ダミーデータ検証
// 'use server';

// import { needsSurveyDB } from '@/app/_db/needs-survey';
// import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
// import { getCurrentUser } from '@/app/_utils/auth';
// import { getMessage } from '@/app/_utils/message';
// import { needsSurveyContainer } from '../../../../../cosmos';

// type IdeaResponse = {
//   answer: string;
//   log: LLMserviceBackEndLog<'idea'>;
// };

// type IdeaErrorResponse = {
//   error: string;
// };

// // ダミーデータを生成する関数
// function generateDummyResponse(): IdeaResponse {
//   // テーブル形式のダミーレスポンス
//   const templateContent = JSON.stringify(
//     {
//       headers: ['認知', '検討', '購入', '使用', 'リピート'],
//       rows: [
//         {
//           label: '行動',
//           values: [
//             'Web検索を行う',
//             '比較サイトで情報収集',
//             'ECサイトで購入手続き',
//             '商品を実際に使う',
//             'レビュー投稿や再購入検討',
//           ],
//         },
//         {
//           label: '思考',
//           values: [
//             'どんな商品があるか知りたい',
//             '自分に合うかどうか考える',
//             '本当に必要か迷う',
//             '期待通りか評価する',
//             '他と比べてどうか考える',
//           ],
//         },
//         {
//           label: 'ニーズ',
//           values: [
//             '信頼できる情報が欲しい',
//             '比較しやすい情報が欲しい',
//             '簡単に購入したい',
//             '使い方が分かりやすいこと',
//             'サポートや特典が欲しい',
//           ],
//         },
//         {
//           label: '感情',
//           values: ['期待・不安', '迷い・興味', '安心・緊張', '満足・不満', '愛着・失望'],
//         },
//       ],
//     },
//     null,
//     2
//   );

//   // ダミーのログデータ
//   const log = {
//     type: 'idea',
//     model: 'dummy-model',
//     prompt: 'これはテスト用のプロンプトです',
//     temperature: 0.7,
//     maxTokens: 1000,
//     result: 'これはテスト用の結果です',
//     totalTokens: 500,
//     startedAt: new Date().toISOString(),
//     completedAt: new Date().toISOString(),
//   } as unknown as LLMserviceBackEndLog<'idea'>;

//   return {
//     answer: templateContent,
//     log,
//   };
// }

// export async function NeedsSurvey(
//   id: string,
//   industry: string,
//   purpose: string,
//   product: string,
//   persona: string,
//   additionalConsiderations: string
// ): Promise<IdeaResponse | IdeaErrorResponse> {
//   const user = await getCurrentUser();
//   try {
//     console.log('テスト用パラメータ:', {
//       industry,
//       purpose,
//       product,
//       persona,
//       additionalConsiderations,
//     });

//     // ダミーデータを生成
//     const response = generateDummyResponse();
//     console.log('ダミーレスポンス生成完了');

//     // レスポンスデータのサイズをチェック
//     try {
//       const responseSize = Buffer.byteLength(JSON.stringify(response), 'utf8');
//       console.log('応答データサイズ:', responseSize, 'bytes');
//     } catch (sizeError) {
//       console.error('サイズ計算エラー:', sizeError);
//     }

//     // 応答を文字列として安全に処理
//     const safeAnswer =
//       typeof response.answer === 'string' ? response.answer : JSON.stringify(response.answer);

//     // log
//     try {
//       await needsSurveyDB(needsSurveyContainer, {
//         id,
//         userId: user.id,
//         useName: user.name,
//         userEmail: user.email,
//         userDepartmentName: user.departmentName,
//         createdAt: new Date(),
//         industry,
//         purpose,
//         product,
//         persona,
//         additionalConsiderations,
//         outputForm: safeAnswer,
//         log: response.log,
//       });
//     } catch (dbError) {
//       console.error('データベース保存エラー:', dbError);
//       // DBエラーでもフロントエンドには結果を返す
//     }

//     return {
//       answer: safeAnswer,
//       log: response.log,
//     };
//   } catch (error) {
//     console.error('危機管理シナリオ作成error 詳細:', error);

//     if (error instanceof Error) {
//       console.error('エラーメッセージ:', error.message);
//       console.error('エラースタック:', error.stack);

//       // エラーメッセージから有用な情報を抽出
//       if (error.message.includes('exceeded the size limit')) {
//         return { error: 'レスポンスサイズが制限を超えています。より短い入力で試してください。' };
//       }

//       // 正規表現を使ってJSON部分を抽出
//       const jsonRegex = /\{[\s\S]*\}/; // 波括弧から始まり波括弧で終わる部分を抽出
//       const jsonMatch = error.message.match(jsonRegex);

//       if (jsonMatch) {
//         try {
//           const errorObj = JSON.parse(jsonMatch[0]);
//           return { error: errorObj.error_message };
//         } catch (parseError) {
//           console.error('JSONパースエラー:', parseError);
//         }
//       }
//     }
//     return { error: getMessage('E_F_00110', '作成結果') };
//   }
// }
