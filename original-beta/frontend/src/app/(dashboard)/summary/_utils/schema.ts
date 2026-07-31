import { z } from 'zod';

export const MAX_TEXT_LENGTH = 10000;

export const summarySchema = z.object({
  activeTab: z.string(),
  content: z
    .string()
    .min(1, {
      message: '要約したい文章を入力してください',
    })
    .refine((value) => value.trim() !== ''),
  summaryLength: z.preprocess(
    (val) => Number(val),
    z
      .number()
      .min(1, {
        message: '要約モードを選択してください',
      })
      .max(MAX_TEXT_LENGTH, {
        message: `要約文字数は${MAX_TEXT_LENGTH}文字以下を指定してください`,
      })
  ),
  consideration: z.string().optional(),
});

export type SummarySchema = z.infer<typeof summarySchema>;
