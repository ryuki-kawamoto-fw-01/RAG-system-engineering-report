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

export interface FileReference {
  name: string;
  type: string;
  size: number;
}

const defaultSchema = z.object({
  content1: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  content2: z.string().optional(),
  content3: z.string().optional(),
});

export const textCheckTextSchema = defaultSchema.merge(
  z.object({
    text: z
      .string()
      .min(1)
      .refine((value) => value.trim() !== ''),
  })
);

export const textCheckFileSchema = defaultSchema.merge(
  z.object({
    fileList: z
      .union([
        z.custom<FileList>(),
        z.array(
          z.object({
            name: z.string(),
            type: z.string(),
            size: z.number(),
          })
        ),
      ])
      .refine((files) => {
        if (files instanceof FileList) {
          return files.length > 0;
        }
        return Array.isArray(files) && files.length > 0;
      }, 'ファイルを1つ以上選択してください'),
  })
);

export type TextSchema = typeof textCheckTextSchema;
export type FileSchema = typeof textCheckFileSchema;

export type TextCheckSchema = z.infer<TextSchema> | z.infer<FileSchema>;
