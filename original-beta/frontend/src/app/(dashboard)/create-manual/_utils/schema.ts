import * as z from 'zod';

export const createManualSchema = z.object({
  file: z.array(z.string()).min(1).max(1, '動画ファイルは1つまでアップロード可能です'),
  ext: z.string().default('.xlsx'),
  similarityThreshold: z.number().optional(),
});

export type CreateManualSchema = z.infer<typeof createManualSchema>;
