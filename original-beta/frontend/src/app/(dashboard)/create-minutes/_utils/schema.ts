import * as z from 'zod';

export interface FileReference {
  name: string;
  type: string;
  size: number;
}

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
export const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
};
export const createMinutesSchema = z.object({
  fileList: z
    .custom<FileReference[]>()
    .refine((files) => files && files.length > 0, 'ファイルを選択してください')
    .refine(
      (files) => files.every((file) => file.size <= MAX_FILE_SIZE),
      'ファイルサイズは最大20MBです'
    )
    .refine(
      (files) =>
        files.every((file) => {
          const allowedTypes = Object.keys(ALLOWED_FILE_TYPES);
          return allowedTypes.includes(file.type);
        }),
      '許可されていないファイル形式です'
    ),
  meetingPurpose: z.string().optional().or(z.literal('')),
});

export const fixMinutesSchema = z.object({
  fileList: z
    .custom<FileReference[]>()
    .refine((files) => files && files.length > 0, 'ファイルを選択してください')
    .refine(
      (files) => files.every((file) => file.size <= MAX_FILE_SIZE),
      'ファイルサイズは最大20MBです'
    )
    .refine(
      (files) =>
        files.every((file) => {
          const allowedTypes = Object.keys(ALLOWED_FILE_TYPES);
          return allowedTypes.includes(file.type);
        }),
      '許可されていないファイル形式です'
    ),
  resultMinutes: z.string().min(1),
  revisionPrompt: z.string().min(1),
});

export type CreateMinutesSchema = z.infer<typeof createMinutesSchema>;
export type FixMinutesSchema = z.infer<typeof fixMinutesSchema>;
