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
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
};
export const designDocumentReviewSchema = z.object({
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
  reviewPurpose: z.string().optional(),
  priorityPoint: z.string().optional(),
  consideration: z.string().optional(),
});

export type DesignDocumentReviewSchema = z.infer<typeof designDocumentReviewSchema>;
