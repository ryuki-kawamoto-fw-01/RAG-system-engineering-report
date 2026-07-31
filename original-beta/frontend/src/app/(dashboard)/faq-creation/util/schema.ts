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

const defaultSchema = z.object({
  documentType: z.string().min(1),
  checkpoints: z.array(z.string()).refine((value) => value.length > 0),
  additionalConsiderations: z.string().optional(),
  consideration: z.string().optional(),
  questionerPosition: z.string().optional(),
  respondentPosition: z.string().optional(),
});

export const faqcreationSchema = defaultSchema.merge(
  z.object({
    text: z.string().min(1, {
      message: '文章を入力してください',
    }),
  })
);

export const faqcreationFileSchema = defaultSchema.merge(
  z.object({
    fileList: z
      .custom<FileList>()
      // 各ファイルのサイズが最大サイズ以下であることをチェック
      .refine(
        (files) => Array.from(files!).every((file) => file.size <= MAX_FILE_SIZE),
        `ファイルサイズは最大${MAX_FILE_SIZE / (1024 * 1024)}MBです`
      )
      // 各ファイルのMIMEタイプが許可された形式であることをチェック
      .refine(
        (files) =>
          Array.from(files!).every((file) => {
            const allowedFileTypes = Object.keys(ALLOWED_FILE_TYPES).flat();
            return allowedFileTypes.includes(file.type);
          }),
        `許可されていないファイル形式です`
      ),
  })
);

export type TextSchema = typeof faqcreationSchema;
export type FileSchema = typeof faqcreationFileSchema;

export type FaqcreationSchema = z.infer<TextSchema & FileSchema>;
