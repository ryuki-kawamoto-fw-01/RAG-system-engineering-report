'use server';

import { designDocumentDB } from '@/app/_db/design-document';
import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
import { getCurrentUser } from '@/app/_utils/auth';
import { getMessage } from '@/app/_utils/message';
import { useCaseAzureFunctions } from '../../../../../azure-functions';
import { createDesignDocumentContainer } from '../../../../../cosmos';

type IdeaResponse = {
  answer: string;
  log: LLMserviceBackEndLog<'idea'>;
};

type IdeaErrorResponse = {
  error: string;
};

export async function DesignDocument(
  id: string,
  product: string,
  purpose: string,
  feature: string,
  additionalConsiderations?: string
): Promise<IdeaResponse | IdeaErrorResponse> {
  const user = await getCurrentUser();
  try {
    console.log('バックエンドAPIリクエスト送信:', {
      product,
      purpose,
      feature,
      additionalConsiderations,
    });

    const response = await useCaseAzureFunctions.sendJson<
      {
        product: string;
        purpose: string;
        feature: string;
        additionalConsiderations?: string;
      },
      IdeaResponse
    >('create-design-document', 'POST', {
      product,
      purpose,
      feature,
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
      await designDocumentDB(createDesignDocumentContainer, {
        id,
        userId: user.id,
        useName: user.name,
        userEmail: user.email,
        userDepartmentName: user.departmentName,
        createdAt: new Date(),
        product,
        purpose,
        feature,
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
    console.error('設計書作成error 詳細:', error);

    if (error instanceof Error) {
      console.error('エラーメッセージ:', error.message);
      console.error('エラースタック:', error.stack);

      // エラーメッセージから有用な情報を抽出
      if (error.message.includes('exceeded the size limit')) {
        return { error: 'レスポンスサイズが制限を超えています。より短い入力で試してください。' };
      }

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

// import { designDocumentDB } from '@/app/_db/design-document';
// import { LLMserviceBackEndLog } from '@/app/_types/logs/llm-services';
// import { getCurrentUser } from '@/app/_utils/auth';
// import { getMessage } from '@/app/_utils/message';
// // import { useCaseAzureFunctions } from '../../../../../azure-functions';
// import { createDesignDocumentContainer } from '../../../../../cosmos';

// type IdeaResponse = {
//   answer: string;
//   log: LLMserviceBackEndLog<'idea'>;
// };

// type IdeaErrorResponse = {
//   error: string;
// };

// // ダミーデータを生成する関数
// function generateDummyResponse(): IdeaResponse {
//   // 設計書のテンプレート
//   const templateContent = `
// # AIカメラ設計書

// ## 1. 製品仕様
// - 製品名：AIカメラ
// - 目的：異常検知
// - 機能：リアルタイム検知

// ## 2. 設計要件
// - 法規制：ISO/IEC 27001
// - 業界標準：ONVIF Profile S/T
// - 顧客要求：24時間連続運転

// ## 3. 材料仕様
// - 筐体：アルミダイカスト
// - レンズ：強化ガラス
// - 基板：FR-4 8層

// ## 4. 製造プロセス
// 1. 筐体鋳造
// 2. 基板実装
// 3. レンズ組立
// 4. 製品組立
// 5. 検査

// ## 5. テスト基準
// - 機能試験：映像ストリーミング
// - 環境試験：温度サイクル
// - 耐久試験：連続稼働
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

// export async function DesignDocument(
//   id: string,
//   product: string,
//   purpose: string,
//   feature: string,
//   additionalConsiderations?: string
// ): Promise<IdeaResponse | IdeaErrorResponse> {
//   const user = await getCurrentUser();
//   try {
//     console.log('テスト用パラメータ:', {
//       product,
//       purpose,
//       feature,
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
//       await designDocumentDB(createDesignDocumentContainer, {
//         id,
//         userId: user.id,
//         useName: user.name,
//         userEmail: user.email,
//         userDepartmentName: user.departmentName,
//         createdAt: new Date(),
//         product,
//         purpose,
//         feature,
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
//     console.error('設計書作成error 詳細:', error);

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
