import * as z from 'zod';

// ニーズ調査の作成スキーマ
export const needsSurveySchema = z.object({
  // 業界・市場（必須）
  industry: z.string().min(1, {
    message: '業界・市場を入力してください',
  }),
  // 目的（必須）
  purpose: z.string().min(1, {
    message: '目的を入力してください',
  }),
  // 商品・サービスの概要（必須）
  product: z.string().min(1, {
    message: '商品・サービスの概要を入力してください',
  }),
  // 顧客ペルソナ（必須）
  persona: z.string().min(1, {
    message: '顧客ペルソナを入力してください',
  }),
  // 追加考慮事項（任意）
  additionalConsiderations: z.string().optional(),
});

export const newNeedsSurveySchema = z.object({
  newRequest: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  result: z.string().min(1),
});

// 製品比較スキーマの型
export type NeedsSurveySchema = z.infer<typeof needsSurveySchema>;
export type NewNeedsSurveySchema = z.infer<typeof newNeedsSurveySchema>;
