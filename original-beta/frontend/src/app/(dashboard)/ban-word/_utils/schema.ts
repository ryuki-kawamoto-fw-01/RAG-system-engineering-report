import { z } from 'zod';

export const MAX_STRING_LENGTH = 100;

export const BanWordSchema = z.object({
  id: z.string().nullable(),
  banWord: z
    .string()
    .min(1, '禁止ワードを入力してください')
    .max(MAX_STRING_LENGTH, {
      message: `禁止ワードは${MAX_STRING_LENGTH}文字以内で入力してください`,
    }),
  category: z.string().min(1, 'カテゴリーを選択してください'),
});
