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
  additionalConsiderations: z.string().optional(),
});

export const keyPointExtractionSchema = defaultSchema.merge(
  z.object({
    text: z.string().min(1, {
      message: '要点抽出したい文章を入力してください',
    }),
  })
);

export const keyPointExtractionFileSchema = defaultSchema.merge(
  z.object({
    fileList: z
      .union([z.custom<FileList>(), z.array(z.custom<FileReference>())])
      .refine((files) => {
        if (files instanceof FileList) return files.length > 0;
        return Array.isArray(files) && files.length > 0;
      }, 'ファイルを選択してください')
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
          const allowedFileTypes = Object.keys(ALLOWED_FILE_TYPES).flat();
          return Array.from(files).every((file) => allowedFileTypes.includes(file.type));
        }
        return true; // FileReference[]の場合はアップロード済みなのでチェックスキップ
      }, `許可されていないファイル形式です`),
  })
);

export type TextSchema = typeof keyPointExtractionSchema;
export type FileSchema = typeof keyPointExtractionFileSchema;

export type KeyPointExtractionSchema = z.infer<TextSchema & FileSchema>;
