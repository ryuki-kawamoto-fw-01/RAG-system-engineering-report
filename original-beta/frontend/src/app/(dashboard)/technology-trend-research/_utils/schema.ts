import * as z from 'zod';

export const technologytrendResearchSchema = z.object({
  field: z.string().min(1),
  range: z.string().min(1),
  area: z.string().min(1),
  format: z.string().optional(),
});

export type TechnologyTrendResearchSchema = z.infer<typeof technologytrendResearchSchema>;
