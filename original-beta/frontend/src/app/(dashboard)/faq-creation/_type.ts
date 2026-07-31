import { z } from 'zod';
import { faqcreationSchema, faqcreationFileSchema } from './util/schema';

// FAQの入力内容を保存するための型
export type FaqCreation = {
  description: string;
  questionerPosition: string;
  respondentPosition: string;
  consideration?: string;
};

// FAQ作成後のレスポンスを格納する型（必要なら定義）
// export type FaqResponse = {
//   results: FaqResult; // FaqResult型が必要なら別途定義
//   // references?: string;
// };

// FAQ作成時のバリデーションエラー型
export type FaqCreationErrors = z.inferFlattenedErrors<typeof faqcreationSchema>['fieldErrors'];

// ファイルアップロード時のバリデーションエラー型
export type FaqCreationFileErrors = z.inferFlattenedErrors<
  typeof faqcreationFileSchema
>['fieldErrors'];
