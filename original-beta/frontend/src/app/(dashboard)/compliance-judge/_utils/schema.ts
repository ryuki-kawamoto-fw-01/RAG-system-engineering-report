import * as z from 'zod';

export const judgeIdeaSchema = z.object({
  function: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  use: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  market: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  country: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
});

export const judgeNewIdeaSchema = z.object({
  newJudgeRequest: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  result: z.string().min(1),
});

export type JudgeIdeaSchema = z.infer<typeof judgeIdeaSchema>;
export type JudgeNewIdeaSchema = z.infer<typeof judgeNewIdeaSchema>;
