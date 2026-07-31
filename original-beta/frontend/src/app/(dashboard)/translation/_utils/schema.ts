import * as z from 'zod';

export const translationSchema = z.object({
  inputText: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  sourceLanguage: z.string().min(1),
  targetLanguage: z.string().min(1),
  considerations: z.string().optional(),
});

export type TranslationSchema = z.infer<typeof translationSchema>;
