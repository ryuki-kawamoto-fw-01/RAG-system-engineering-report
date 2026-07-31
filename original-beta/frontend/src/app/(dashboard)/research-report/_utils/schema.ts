import * as z from 'zod';

export const MAX_COUNT = 20;

export const researchReportSchema = z.object({
  subject: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  purpose: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  method: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  researchresult: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  references: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  count: z.number().min(1).max(MAX_COUNT),
  consideration: z.string().optional(),
});

export const researchNewReportSchema = z.object({
  newRequest: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  result: z.string().min(1),
});

export type ResearchReportSchema = z.infer<typeof researchReportSchema>;
export type ResearchNewReportSchema = z.infer<typeof researchNewReportSchema>;
