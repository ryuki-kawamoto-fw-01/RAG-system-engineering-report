import * as z from 'zod';

// 危機管理シナリオの作成スキーマ
export const crisisManagementScenariosSchema = z.object({
  // 業界・業種（必須）
  industry: z.string().min(1, {
    message: '業界・業種を入力してください',
  }),
  // 企業規模・拠点情報（必須）
  businessSize: z.string().min(1, {
    message: '企業規模・拠点情報を入力してください',
  }),
  // シナリオを作成する業務内容（必須）
  businessContent: z.string().min(1, {
    message: 'シナリオを作成する業務内容を入力してください',
  }),
  // リスクカテゴリ（必須）
  selectedOptions: z.array(z.string()).min(1, {
    message: 'リスクカテゴリを選択してください',
  }),
  // リスク内容（任意）
  additionalContents: z.string().optional(),
  // 追加考慮事項（任意）
  additionalConsiderations: z.string().optional(),
});

export const newCrisisManagementScenariosSchema = z.object({
  newRequest: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  result: z.string().min(1),
});

// 製品比較スキーマの型
export type CrisisManagementScenariosSchema = z.infer<typeof crisisManagementScenariosSchema>;
export type NewCrisisManagementScenariosSchema = z.infer<typeof newCrisisManagementScenariosSchema>;
