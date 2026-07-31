import { z } from 'zod';

export const MAX_TEXT_LENGTH = 10000;

export const productionTechListSchema = z.object({
  activeTab: z.string(),
  category: z.string().min(1, {
    message: '生産技術を洗い出したい分野を入力してください',
  }),
  focus: z.string().min(1, {
    message: '生産技術に関して特に重視したい点を入力してください',
  }),
  issues: z.string().optional(),
  productionTechListSchemaLength: z.preprocess(
    (val) => Number(val),
    z
      .number()
      .min(1, {
        message: '生産技術を洗い出したい分野の文字数は1以上である必要があります',
      })
      .max(MAX_TEXT_LENGTH, {
        message: `生産技術を洗い出したい分野の文字数は${MAX_TEXT_LENGTH}文字以下を指定してください`,
      })
  ),
});

export const productionTechListReAnalysisSchema = z.object({
  category: z.array(z.string()).refine((value) => value.length > 0),
  focus: z.array(z.string()).refine((value) => value.length > 0),
  answer: z.string().min(1),
  newProductionTechRequest: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
});

export type ProductionTechListSchema = z.infer<typeof productionTechListSchema>;
export type ProductionTechListReAnalysisSchema = z.infer<typeof productionTechListReAnalysisSchema>;
