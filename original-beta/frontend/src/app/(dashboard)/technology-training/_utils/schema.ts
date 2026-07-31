import * as z from 'zod';

export const MAX_COUNT = 100;

export const technologyTrainingSchema = z.object({
  technology: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  level: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  time: z.number().min(1).max(MAX_COUNT),
  consideration: z.string().optional(),
});

export const fixTrainingSchema = z.object({
  fixTrainingRequest: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  result: z.string().min(1),
});

export type TechnologyTrainingSchema = z.infer<typeof technologyTrainingSchema>;
export type FixTrainingSchema = z.infer<typeof fixTrainingSchema>;
