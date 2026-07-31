import * as z from 'zod';

export const MAX_COUNT = 20;

export const createIdeaSchema = z.object({
  subject: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  role: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  count: z.number().min(1).max(MAX_COUNT),
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
