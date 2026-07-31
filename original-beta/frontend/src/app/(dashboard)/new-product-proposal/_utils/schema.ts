import * as z from 'zod';

export const newproductProposalSchema = z.object({
  name: z.string().min(1),
  market: z.string().min(1),
  target: z.string().min(1),
  concept: z.string().min(1),
  comparisonPoints: z.string().min(1),
  consideration: z.string().optional(),
});

export type NewProductProposalSchema = z.infer<typeof newproductProposalSchema>;
