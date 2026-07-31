import * as z from 'zod';

export const MAX_COUNT = 20;

export const imageGenerationSchema = z.object({
  content: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  size: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  format: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
});

export const fixImageSchema = z.object({
  fixImageRequest: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  result: z.string().min(1),
});

export type ImageGenerationSchema = z.infer<typeof imageGenerationSchema>;
export type FixImageSchema = z.infer<typeof fixImageSchema>;
