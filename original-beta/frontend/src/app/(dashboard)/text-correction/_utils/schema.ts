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

export const checkpointGroups = [
  { name: '基本', items: ['誤字脱字', '文法間違い', '同音異義語の表記ミス', '助詞の選択ミス'] },
  { name: '構造', items: ['文体の統一', '一文の長さ', '段落構成', '半角、全角の統一'] },
  { name: '内容', items: ['文書の用途に適した記述', '論理的な記述'] },
  {
    name: 'その他',
    items: ['読みやすさ', '文章のトーンの統一', '表記ゆれ', '差別語、不快語の使用'],
  },
];

const defaultSchema = z.object({
  documentType: z.string().min(1),
  checkpoints: z.array(z.string()).refine((value) => value.length > 0),
  additionalConsiderations: z.string().optional(),
});

export const textCorrectionSchema = defaultSchema.merge(
  z.object({
    text: z.string().min(1, {
      message: '校正したい文章を入力してください',
    }),
  })
);

export const textCorrectionFileSchema = defaultSchema.merge(
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
      .optional(),
  })
);

export type TextCorrectionTextSchema = z.infer<typeof textCorrectionSchema>;
export type TextCorrectionFileSchema = z.infer<typeof textCorrectionFileSchema>;

export type TextCorrectionSchema = TextCorrectionTextSchema | TextCorrectionFileSchema;
