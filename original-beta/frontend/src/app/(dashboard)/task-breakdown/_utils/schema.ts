import * as z from 'zod';

export const taskBreakdownSchema = z.object({
  task: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  consideration: z.string().optional(),
});

export const fixTaskBreakdownSchema = z.object({
  result: z.string().min(1),
  revisionPrompt: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
});

export type TaskBreakdownSchema = z.infer<typeof taskBreakdownSchema>;
export type FixTaskBreakdownSchema = z.infer<typeof fixTaskBreakdownSchema>;
