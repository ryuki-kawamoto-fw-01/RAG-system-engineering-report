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

export const productCatchphraseTextSchema = z.object({
  name: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  information: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  target: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  competitor: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  consideration: z.string().optional(),
  fileList: z.any().optional(), // ファイル不要
});

export const productCatchphraseFileSchema = z.object({
  fileList: z
    .union([z.custom<FileList>(), z.array(z.custom<FileReference>())])
    .refine((files) => {
      if (files instanceof FileList) return files.length > 0;
      return Array.isArray(files) && files.length > 0;
    }, 'ファイルを選択してください')
    .refine((files) => {
      if (files instanceof FileList) {
        return Array.from(files).every((file) => file.size <= MAX_FILE_SIZE);
      }
      return files.every((file) => file.size <= MAX_FILE_SIZE);
    }, 'ファイルサイズは最大20MBです')
    .refine((files) => {
      if (files instanceof FileList) {
        return Array.from(files).every((file) => {
          const allowedTypes = Object.keys(ALLOWED_FILE_TYPES);
          return allowedTypes.includes(file.type);
        });
      }
      return true; // FileReference[]の場合は既にアップロード済みなのでチェックスキップ
    }, '許可されていないファイル形式です'),
  fileConsideration: z.string().optional(),
});

export type ProductCatchphraseTextSchema = z.infer<typeof productCatchphraseTextSchema>;
export type ProductCatchphraseFileSchema = z.infer<typeof productCatchphraseFileSchema>;
