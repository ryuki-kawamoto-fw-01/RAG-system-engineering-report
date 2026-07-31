import * as z from 'zod';

// ブレインストーミングのスキーマ
export const brainstormingSchema = z.object({
  // メインテーマ（必須）
  theme: z.string().min(1, {
    message: 'メインテーマを入力してください',
  }),
  // 専門家１（必須）
  expert1: z.string().min(1, {
    message: 'アドバイスをもらいたい専門家を入力してください',
  }),
  // 専門家２（必須）
  expert2: z.string().min(1, {
    message: 'アドバイスをもらいたい専門家を入力してください',
  }),
});

export const newBrainstormingSchema = z.object({
  newRequest: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  result: z.string().min(1),
});

// ブレインストーミング比較スキーマの型
export type BrainstormingSchema = z.infer<typeof brainstormingSchema>;
export type NewBrainstormingSchema = z.infer<typeof newBrainstormingSchema>;
