import * as z from 'zod';

export const productComparisonSchema = z.object({
  products: z.array(z.string()).min(1, {
    message: '少なくとも1つの製品名を入力してください',
  }),
  purpose: z.string().min(1, {
    message: '用途・目的を入力してください',
  }),
  additionalConsiderations: z.string().optional(),
});

export type ProductComparisonSchema = z.infer<typeof productComparisonSchema>;
