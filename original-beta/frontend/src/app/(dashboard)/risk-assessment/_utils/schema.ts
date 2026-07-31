import * as z from 'zod';

export const MAX_COUNT = 20;

export const riskAssessmentSchema = z.object({
  workerInfo: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  machineInfo: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  workerCountAndPlacement: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  processDetails: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  currentMeasures: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
});

export type RiskAssessmentSchema = z.infer<typeof riskAssessmentSchema>;
