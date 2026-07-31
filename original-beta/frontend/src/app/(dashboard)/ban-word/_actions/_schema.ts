import { z } from 'zod';

const MAX_STRING_LENGTH = 255;

export const banWordSchema = z.object({
  banWord: z
    .string()
    .min(1, {
      message: '禁止ワードを入力してください',
    })
    .max(MAX_STRING_LENGTH, {
      message: `禁止ワードは${MAX_STRING_LENGTH}文字以内で入力してください`,
    }),
  category: z.string().min(1, {
    message: 'カテゴリーを選択してください',
  }),
});
