import { z } from 'zod';
import { folderSchema } from './folder-schema';

export const addFolderSchema = z.object({
  newName: folderSchema,
});

export type AddFolderFormData = z.infer<typeof addFolderSchema>;
