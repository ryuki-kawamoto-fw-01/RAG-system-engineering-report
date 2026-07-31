import * as z from 'zod';

// 技術評価用のスキーマ
export const TechassessSchema = z.object({
  field: z.string().min(1, { message: '対象とする製造分野を入力してください' }),
  region: z.string().min(1, { message: '地域や市場を入力してください' }),
  companySize: z.string().optional(), // 任意入力に変更
  industryIssues: z.string().min(1, { message: '現在の業界の課題や関心事を入力してください' }),
  granularity: z.string().min(1, { message: '分析の粒度を入力してください' }),
  purpose: z.string().min(1, { message: '使用目的を入力してください' }),
});

export type TechassessSchema = z.infer<typeof TechassessSchema>;
