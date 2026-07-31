import { z } from 'zod';

const MAX_TEXT_LENGTH = 1000;

export const hiyariHatRegisterSchema = z.object({
  category: z.string().min(1, {
    message: 'カテゴリーを選択してください',
  }),
  incident: z
    .string()
    .min(1, {
      message: 'ヒヤリハット事例を入力してください',
    })
    .max(MAX_TEXT_LENGTH, {
      message: `ヒヤリハット事例は${MAX_TEXT_LENGTH}文字以内で入力してください`,
    }),
  counterMeasure: z
    .string()
    .min(1, {
      message: '対策を入力してください',
    })
    .max(MAX_TEXT_LENGTH, {
      message: `対策は${MAX_TEXT_LENGTH}文字以内で入力してください`,
    }),
});

export type HiyariHatRegisterFormData = z.infer<typeof hiyariHatRegisterSchema>;
