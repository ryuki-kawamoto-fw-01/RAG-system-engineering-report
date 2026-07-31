import * as z from 'zod';

export const createTechnologyProposalSchema = z.object({
  technologyName: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  market: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  current_issues: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  consideration: z.string().optional(),
});

export const fixTechnologyProposalSchema = z.object({
  modify: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  result: z.string().min(1),
});

export type CreateTechnologyProposalSchema = z.infer<typeof createTechnologyProposalSchema>;
export type FixTechnologyProposalSchema = z.infer<typeof fixTechnologyProposalSchema>;
