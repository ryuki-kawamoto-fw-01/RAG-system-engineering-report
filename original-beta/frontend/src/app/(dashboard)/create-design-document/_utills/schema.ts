import * as z from 'zod';

// 設計書の作成スキーマ
export const designDocumentSchema = z.object({
  // 製品名（必須）
  product: z.string().min(1, {
    message: '製品名を入力してください',
  }),
  // 用途・目的（必須）
  purpose: z.string().min(1, {
    message: '用途・目的を入力してください',
  }),
  // 主な機能・性能要件（必須）
  feature: z.string().min(1, {
    message: '主な機能・性能要件を入力してください',
  }),
  // 追加考慮事項（任意）
  additionalConsiderations: z.string().optional(),
});

export const designNewDocumentSchema = z.object({
  newRequest: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  result: z.string().min(1),
});

// 製品比較スキーマの型
export type DesignDocumentSchema = z.infer<typeof designDocumentSchema>;
export type DesignNewDocumentSchema = z.infer<typeof designNewDocumentSchema>;
