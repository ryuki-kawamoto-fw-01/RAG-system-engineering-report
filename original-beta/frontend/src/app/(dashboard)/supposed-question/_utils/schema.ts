import * as z from 'zod';

export interface FileReference {
  name: string;
  type: string;
  size: number;
}

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPTED_FILE_TYPES = [
  'text/plain',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

export const supposedQuestionSchema = z.object({
  file: z
    .union([z.custom<FileList>(), z.array(z.custom<FileReference>())])
    .refine((files) => {
      if (files instanceof FileList) {
        return files.length > 0;
      }
      return Array.isArray(files) && files.length > 0;
    }, 'ファイルを選択してください')
    .refine(
      (files) => {
        if (files instanceof FileList) {
          return Array.from(files).every((file) => file.size <= MAX_FILE_SIZE);
        }
        return Array.isArray(files) && files.every((file) => file.size <= MAX_FILE_SIZE);
      },
      `ファイルサイズは最大${MAX_FILE_SIZE / (1024 * 1024)}MBです`
    )
    .refine((files) => {
      if (files instanceof FileList) {
        return Array.from(files).every((file) => ACCEPTED_FILE_TYPES.includes(file.type));
      }
      return Array.isArray(files) && files.every((file) => ACCEPTED_FILE_TYPES.includes(file.type));
    }, `許可されていないファイル形式です`),
  description: z
    .string()
    .min(1, {
      message: '資料説明を入力してください',
    })
    .refine((value) => value.trim() !== ''),
  specialty: z.preprocess((val) => Number(val), z.number().min(0).max(100)),
  interest: z.preprocess((val) => Number(val), z.number().min(0).max(100)),
  intimacy: z.preprocess((val) => Number(val), z.number().min(0).max(100)),
  consideration: z.string().optional(),
});

export const modifiedSupposedQuestionSchema = z.object({
  description: z
    .string()
    .min(1, {
      message: '修正内容を入力してください',
    })
    .refine((value) => value.trim() !== ''),
  temp_file: z.string().min(1),
  result: z.string().min(1),
});

export type SupposedQuestionSchema = z.infer<typeof supposedQuestionSchema>;
export type ModifiedSupposedQuestionSchema = z.infer<typeof modifiedSupposedQuestionSchema>;
