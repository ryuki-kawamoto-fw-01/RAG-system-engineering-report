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

// Blob Storage参照型
export interface FileReference {
  name: string; // Blob Storageパス
  type: string; // MIMEタイプ
  size: number; // ファイルサイズ
}

const defaultSchema = z.object({
  productName: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  productPurpose: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
});

export const troubleShootingSchema = defaultSchema.merge(
  z.object({
    productSpecificationText: z
      .string()
      .min(1)
      .refine((value) => value.trim() !== ''),
  })
);

export const troubleShootingFileSchema = defaultSchema.merge(
  z.object({
    productSpecificationFiles: z
      .union([z.custom<FileList>(), z.array(z.custom<FileReference>())])
      .refine(
        (files) => {
          if (files instanceof FileList) {
            return Array.from(files).every((file) => file.size <= MAX_FILE_SIZE);
          }
          return files.every((file) => file.size <= MAX_FILE_SIZE);
        },
        `ファイルサイズは最大${MAX_FILE_SIZE / (1024 * 1024)}MBです`
      )
      .refine((files) => {
        if (files instanceof FileList) {
          return Array.from(files).every((file) => {
            const allowedFileTypes = Object.keys(ALLOWED_FILE_TYPES).flat();
            return allowedFileTypes.includes(file.type);
          });
        }
        return files.every((file) => {
          const allowedFileTypes = Object.keys(ALLOWED_FILE_TYPES).flat();
          return allowedFileTypes.includes(file.type);
        });
      }, `許可されていないファイル形式です`),
  })
);

export type TextSchema = typeof troubleShootingSchema;
export type FileSchema = typeof troubleShootingFileSchema;
export type TroubleShootingSchema = z.infer<TextSchema & FileSchema>;
