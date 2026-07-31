import * as z from 'zod';

export const defectAnalysisReportSchema = z.object({
  productName: z
    .string()
    .min(1, '製品名は必須です')
    .refine((value) => value.trim() !== '', '製品名を入力してください'),
  defectDescription: z
    .string()
    .min(1, '不具合内容は必須です')
    .refine((value) => value.trim() !== '', '不具合内容を入力してください'),
  occurenceCondition: z
    .string()
    .min(1, '発生条件は必須です')
    .refine((value) => value.trim() !== '', '発生条件を入力してください'),
  usageEnvironment: z
    .string()
    .min(1, '使用環境は必須です')
    .refine((value) => value.trim() !== '', '使用環境を入力してください'),
  impactScope: z
    .string()
    .min(1, '影響範囲は必須です')
    .refine((value) => value.trim() !== '', '影響範囲を入力してください'),
  defectData: z
    .string()
    .min(1, '不具合データは必須です')
    .refine((value) => value.trim() !== '', '不具合データを入力してください'),
  consideration: z.string().optional(),
});

export const defectAnalysisReportReAnalysisSchema = z.object({
  result: z
    .string()
    .min(1, '分析結果は必須です')
    .refine((value) => value.trim() !== '', '分析結果を入力してください'),
  modify: z
    .string()
    .min(1, '修正要求は必須です')
    .refine((value) => value.trim() !== '', '修正要求を入力してください'),
});

export type DefectAnalysisReportSchema = z.infer<typeof defectAnalysisReportSchema>;
export type DefectAnalysisReportReAnalysisSchema = z.infer<
  typeof defectAnalysisReportReAnalysisSchema
>;
