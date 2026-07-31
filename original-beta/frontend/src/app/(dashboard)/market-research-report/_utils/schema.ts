import * as z from 'zod';

export const marketresearchReportSchema = z.object({
  market: z.string().min(1),
  competitor: z.string().min(1),
  target: z.string().min(1),
  purpose: z.string().min(1),
  consideration: z.string().optional(),
});

export type MarketResearchReportSchema = z.infer<typeof marketresearchReportSchema>;
