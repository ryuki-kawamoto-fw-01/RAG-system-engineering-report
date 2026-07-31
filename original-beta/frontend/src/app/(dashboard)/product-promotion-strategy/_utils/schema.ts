import * as z from 'zod';

export const MAX_COUNT = 20;

export const productPromotionStrategySchema = z.object({
  productDescription: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  targetMarket: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  differentiationPoint: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  promotionTools: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  salesChannels: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
});

export type ProductPromotionStrategySchema = z.infer<typeof productPromotionStrategySchema>;
