'use server';

import { crisisManagementScenariosDB } from '@/app/_db/crisis-management-scenarios';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { crisisManagementScenariosContainer } from '../../../../../cosmos';

type IdeaResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'idea'>;
};

type IdeaErrorResponse = {
  error: string;
};

export async function CrisisManagementScenarios(
  id: string,
  industry: string,
  businessSize: string,
  businessContent: string,
  selectedOptions: string[],
  additionalContents?: string,
  additionalConsiderations?: string
): Promise<IdeaResponse | IdeaErrorResponse> {
  const user = await getCurrentUser();
  try {
    const response = await useCaseAzureFunctions.sendJson<
      {
        industry: string;
        businessSize: string;
        businessContent: string;
        selectedOptions: string[];
        additionalContents?: string;
        additionalConsiderations?: string;
      },
      IdeaResponse
    >('crisis-management-scenarios', 'POST', {
      industry,
      businessSize,
      businessContent,
      selectedOptions,
      additionalContents,
      additionalConsiderations,
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
      await crisisManagementScenariosDB(crisisManagementScenariosContainer, {
        id,
        userId: user.id,
        useName: user.name,
        userEmail: user.email,
        userDepartmentName: user.departmentName,
        createdAt: new Date(),
        industry,
        businessSize,
        businessContent,
        selectedOptions,
        additionalContents,
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
    console.error('危機管理シナリオ作成error 詳細:', error);
    return { error: error instanceof Error ? error.message : getMessage('E_F_00110', '作成結果') };
  }
}

// ダミーデータ検証
// 'use server';

// import { crisisManagementScenariosDB } from '@/app/_db/crisis-management-scenarios';
// import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
// import { getCurrentUser } from '@/app/_utils/auth';
// import { getMessage } from '@/app/_utils/message';
// // import { useCaseAzureFunctions } from '../../../../../azure-functions';
// import { crisisManagementScenariosContainer } from '../../../../../cosmos';

// type IdeaResponse = {
//   answer: string;
//   log: LLMserviceBackEndLog<'idea'>;
// };

// type IdeaErrorResponse = {
//   error: string;
// };

// // ダミーデータを生成する関数
// function generateDummyResponse(): IdeaResponse {
//   // テストレスポンス
//   const templateContent = `
// # 危機管理シナリオ

// ## 1. テスト
// - テスト１
// - テスト２
// - テスト３
// `;

//   // ダミーのログデータ
//   const log = {
//     type: 'idea',
//     model: 'dummy-model',
//     prompt: 'これはテスト用のプロンプトです',
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

// export async function CrisisManagementScenarios(
//   id: string,
//   industry: string,
//   businessSize: string,
//   businessContent: string,
//   selectedOptions: string[],
//   additionalContents?:string,
//   additionalConsiderations?: string
// ): Promise<IdeaResponse | IdeaErrorResponse> {
//   const user = await getCurrentUser();
//   try {
//     console.log('テスト用パラメータ:', {
//       industry,
//       businessSize,
//       businessContent,
//       selectedOptions,
//       additionalContents,
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
//       await crisisManagementScenariosDB(crisisManagementScenariosContainer, {
//         id,
//         userId: user.id,
//         useName: user.name,
//         userEmail: user.email,
//         userDepartmentName: user.departmentName,
//         createdAt: new Date(),
//         industry,
//         businessSize,
//         businessContent,
//         selectedOptions,
//         additionalContents,
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
