import * as z from 'zod';

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
export const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
};
export const transcriptionHandwrittenSchema = z.object({
  fileList: z
    .custom<FileList>()
    .refine((files) => files.length > 0, 'ファイルを選択してください')
    .refine(
      (files) => Array.from(files).every((file) => file.size <= MAX_FILE_SIZE),
      'ファイルサイズは最大20MBです'
    )
    .refine(
      (files) =>
        Array.from(files).every((file) => {
          const allowedTypes = Object.keys(ALLOWED_FILE_TYPES);
          return allowedTypes.includes(file.type);
        }),
      '許可されていないファイル形式です'
    ),
  meetingPurpose: z.string().optional(),
});

export type TranscriptionHandwrittenSchema = z.infer<typeof transcriptionHandwrittenSchema>;
