import * as z from 'zod';

export const createScheduleSchema = z.object({
  newSchedulework: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  newSchedulestartdate: z.date(),
  newScheduleenddate: z.date(),
  newScheduleConsiderations: z.string().optional(),
});

export type CreateScheduleSchema = z.infer<typeof createScheduleSchema>;
