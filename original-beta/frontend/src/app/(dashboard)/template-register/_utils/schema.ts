import { z } from 'zod';

const MAX_STRING_LENGTH = 20;
export const MAX_TEXT_LENGTH = 5000;

export const PromptTemplateSchema = z.object({
  category: z.string().min(1, {
    message: 'カテゴリーを選択してください',
  }),
  title: z
    .string()
    .min(1, {
      message: 'タイトルを入力してください',
    })
    .max(MAX_STRING_LENGTH, {
      message: `タイトルは${MAX_STRING_LENGTH}文字以内で入力してください`,
    }),
  content: z
    .string()
    .min(1, {
      message: 'プロンプトを入力してください',
    })
    .max(MAX_TEXT_LENGTH, {
      message: `プロンプトは${MAX_TEXT_LENGTH}文字以内で入力してください`,
    }),
});
