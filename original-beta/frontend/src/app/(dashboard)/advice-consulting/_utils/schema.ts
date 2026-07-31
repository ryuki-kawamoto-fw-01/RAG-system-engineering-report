import * as z from 'zod';

export const MAX_COUNT = 20;

export const adviceConsultingSchema = z.object({
  role: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  constraints: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  adviceInput: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
});

export type AdviceConsultingSchema = z.infer<typeof adviceConsultingSchema>;
