import * as z from 'zod';

export const wallHittingSchema = z.object({
  theme: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  idea: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
});

export type WallHittingSchema = z.infer<typeof wallHittingSchema>;
