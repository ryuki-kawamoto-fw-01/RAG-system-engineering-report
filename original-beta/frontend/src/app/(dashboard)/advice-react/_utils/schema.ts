import * as z from 'zod';

export const MAX_COUNT = 20;

export const adviceReactSchema = z.object({
  adviceInput: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
});

export type AdviceReactSchema = z.infer<typeof adviceReactSchema>;
