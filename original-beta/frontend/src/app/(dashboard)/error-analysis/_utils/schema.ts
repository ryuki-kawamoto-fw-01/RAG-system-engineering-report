import * as z from 'zod';

export const createErrorAnalysisSchema = z.object({
  programmingLanguage: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  errorMessage: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  considerations: z.string().optional(),
});

export type CreateErrorAnalysisSchema = z.infer<typeof createErrorAnalysisSchema>;
