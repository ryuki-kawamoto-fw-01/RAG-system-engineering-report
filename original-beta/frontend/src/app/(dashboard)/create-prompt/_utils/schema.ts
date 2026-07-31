import * as z from 'zod';

export const createPromptSchema = z.object({
  originalPrompt: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
});

export const fixPromptSchema = z.object({
  result: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  revisionPrompt: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
});

export type CreatePromptSchema = z.infer<typeof createPromptSchema>;
export type FixPromptSchema = z.infer<typeof fixPromptSchema>;
