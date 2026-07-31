import { z } from 'zod';

export const MAX_TEXT_LENGTH = 10000;

export const businessPlanSchema = z.object({
  activeTab: z.string(),
  businessName: z.string().min(1, {
    message: '事業名を入力してください',
  }),
  businessPurpose: z.string().min(1, {
    message: '事業の目的・背景・解決する課題を入力してください',
  }),
  targetMarket: z.string().min(1, {
    message: 'ターゲット市場・顧客層を入力してください',
  }),
  businessModel: z.string().min(1, {
    message: '収益モデル・事業の仕組みを入力してください',
  }),
  competitiveAdvantage: z.string().min(1, {
    message: '競合優位性・独自性を入力してください',
  }),
  financialProjection: z.string().min(1, {
    message: '財務計画・収支予測を入力してください',
  }),
  businessPlanSchemaLength: z.preprocess(
    (val) => Number(val),
    z
      .number()
      .min(1, {
        message: '各項目の文字数は1以上である必要があります',
      })
      .max(MAX_TEXT_LENGTH, {
        message: `各項目の文字数は${MAX_TEXT_LENGTH}文字以下を指定してください`,
      })
  ),
});

export const BusinessPlanReAnalysisSchema = z.object({
  businessName: z.array(z.string()).refine((value) => value.length > 0),
  businessPurpose: z.array(z.string()).refine((value) => value.length > 0),
  targetMarket: z.array(z.string()).refine((value) => value.length > 0),
  businessModel: z.array(z.string()).refine((value) => value.length > 0),
  competitiveAdvantage: z.array(z.string()).refine((value) => value.length > 0),
  financialProjection: z.array(z.string()).refine((value) => value.length > 0),
  answer: z.string().min(1),
  newBusinessPlanRequest: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
});

export type BusinessPlanSchema = z.infer<typeof businessPlanSchema>;
export type BusinessPlanReAnalysisSchema = z.infer<typeof BusinessPlanReAnalysisSchema>;
