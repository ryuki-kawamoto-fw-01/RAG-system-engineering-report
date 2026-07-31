import * as z from 'zod';

export const MAX_COUNT = 20;

export const createIdeaSchema = z.object({
  product: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  features: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  consideration: z.string().optional(),
});

export const createNewIdeaSchema = z.object({
  newIdeaRequest: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  result: z.string().min(1),
});

export type CreateIdeaSchema = z.infer<typeof createIdeaSchema>;
export type CreateNewIdeaSchema = z.infer<typeof createNewIdeaSchema>;
