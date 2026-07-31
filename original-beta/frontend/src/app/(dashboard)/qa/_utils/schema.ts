import { z } from 'zod';

export const QUESTION_MAX_LENGTH = 300;
export const ANSWER_MAX_LENGTH = 1000;

export const QASchema = z.object({
  category: z.string().min(1, 'カテゴリーを選択してください'),
  work_category: z.string().min(1, 'サブカテゴリーを選択してください'),
  question: z
    .string()
    .min(1, '質問を入力してください')
    .max(QUESTION_MAX_LENGTH, `質問は${QUESTION_MAX_LENGTH}文字以内で入力してください`),
  answer: z
    .string()
    .min(1, '回答を入力してください')
    .max(ANSWER_MAX_LENGTH, `回答は${ANSWER_MAX_LENGTH}文字以内で入力してください`),
});
