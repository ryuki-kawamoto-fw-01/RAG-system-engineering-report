import * as z from 'zod';

export const productAARRRSchema = z.object({
  product_service: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  product_service_content: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  additionalConsiderations: z.string().optional(),
});

export type ProductAARRRSchema = z.infer<typeof productAARRRSchema>;
