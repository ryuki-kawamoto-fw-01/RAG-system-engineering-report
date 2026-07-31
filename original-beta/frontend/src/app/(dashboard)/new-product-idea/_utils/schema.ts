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

export const newProductIdeaSchema = defaultSchema.merge(
  z.object({
    text: z.string().min(1, {
      message: '新商品のアイデアを入力してください',
    }),
    ideaDirection: z.string().min(1, {
      message: 'アイデアの方向性を入力してください',
    }),
  })
);

export const newProductIdeaFileSchema = defaultSchema.merge(
  z.object({
    fileList: z
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
        return true; // FileReference[]の場合は既にアップロード済み
      }, `許可されていないファイル形式です`),
    ideaDirection: z.string().min(1, {
      message: 'アイデアの方向性を入力してください',
    }),
  })
);

export type TextSchema = typeof newProductIdeaSchema;
export type FileSchema = typeof newProductIdeaFileSchema;

export type NewProductIdeaSchema = z.infer<TextSchema & FileSchema>;
