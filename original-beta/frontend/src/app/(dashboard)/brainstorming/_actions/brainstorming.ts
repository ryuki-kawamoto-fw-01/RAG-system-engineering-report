'use server';

import { brainstormingDB } from '@/app/_db/brainstorming';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { brainstormingContainer } from '../../../../../cosmos';

type IdeaResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'idea'>;
};

type IdeaErrorResponse = {
  error: string;
};

export async function Brainstorming(
  id: string,
  theme: string,
  expert1: string,
  expert2: string
): Promise<IdeaResponse | IdeaErrorResponse> {
  const user = await getCurrentUser();
  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        theme: string;
        expert1: string;
        expert2: string;
      },
      IdeaResponse
    >('brainstorming', 'POST', {
      theme,
      expert1,
      expert2,
    });

    if (!response || !response.answer) {
      console.error('有効な回答がレスポンスに含まれていません:', response);
      return { error: getMessage('E_F_00110', '作成結果') };
    }

    // 応答を文字列として安全に処理
    const safeAnswer =
      typeof response.answer === 'string' ? response.answer : JSON.stringify(response.answer);

    // log
    try {
      await brainstormingDB(brainstormingContainer, {
        id,
        userId: user.id,
        useName: user.name,
        userEmail: user.email,
        userDepartmentName: user.departmentName,
        createdAt: new Date(),
        theme,
        expert1,
        expert2,
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
    console.error('ブレインストーミングerror 詳細:', error);
    return { error: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果') };
  }
}

// // ダミーデータ検証
// 'use server';

// import { brainstormingDB } from '@/app/_db/brainstorming';
// import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
// import { getCurrentUser } from '@/app/_utils/auth';
// import { getMessage } from '@/app/_utils/message';
// // import { useCaseAzureFunctions } from '../../../../../azure-functions';
// // import { brainstormingContainer } from '../../../../../cosmos';

// type IdeaResponse = {
//   answer: string;
//   log: LLMserviceBackEndLog<'idea'>;
// };

// type IdeaErrorResponse = {
//   error: string;
// };

// // ダミーデータを生成する関数
// function generateDummyResponse(): IdeaResponse {
//   // ブレインストーミングのテンプレート
//   const templateContent = `
// # メインテーマ
// 社内業務を効率化するためのサービスで生成AIをどう活用できるか

// ## 専門家１のアイデア
// 市場アナリスト
// - アイデア１
// - アイデア２

// ## 専門家２のアイデア
// 戦略コンサルタント
// - アイデア１
// - アイデア２
// `;

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

// export async function Brainstorming(
//   id: string,
//   theme: string,
//   expert1: string,
//   expert2: string
// ): Promise<IdeaResponse | IdeaErrorResponse> {
//   const user = await getCurrentUser();
//   try {
//     console.log('テスト用パラメータ:', {
//       theme,
//       expert1,
//       expert2,
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
//       await brainstormingDB( {
//       //await brainstormingDB(brainstormingContainer, {
//         id,
//         userId: user.id,
//         useName: user.name,
//         userEmail: user.email,
//         userDepartmentName: user.departmentName,
//         createdAt: new Date(),
//         theme,
//         expert1,
//         expert2,
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
//     console.error('ブレインストーミングerror 詳細:', error);

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
