import * as z from 'zod';

export const createProductNameSchema = z.object({
  subject: z.string().min(1),
  role: z.string().min(1),
  convention: z.string().min(1),
});

export const createNewProductNameSchema = z.object({
  newProductNameRequest: z.string().min(1),
  result: z.string().min(1),
});

export type CreateProductNameSchema = z.infer<typeof createProductNameSchema>;
export type CreateNewProductNameSchema = z.infer<typeof createNewProductNameSchema>;
