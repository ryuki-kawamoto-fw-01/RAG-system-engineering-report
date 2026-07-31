import { z } from 'zod';

export const summarySchema = z.object({
  domain: z.string().min(1, {
    message: '解説して欲しい用語の分野を入力してください',
  }),

  content: z.string().min(1, {
    message: '要約したい文章を入力してください',
  }),

  consideration: z.string().optional(),
});

export type SummarySchema = z.infer<typeof summarySchema>;
