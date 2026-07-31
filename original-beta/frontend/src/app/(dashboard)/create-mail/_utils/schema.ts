import * as z from 'zod';

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
export const ACCEPTED_FILE_TYPES = ['application/octet-stream'];

export interface FileReference {
  name: string; // ファイルパス
  type: string; // MIMEタイプ
  size: number; // ファイルサイズ
}

export const createNewMailSchema = z.object({
  newMailTo: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  newMailFrom: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  newMailPurpose: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  newMailContent: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  newMailConsiderations: z.string().optional(),
});

export const createReplyMailSchema = z
  .object({
    activeTab: z.string(),
    replyMailTo: z
      .string()
      .min(1)
      .refine((value) => value.trim() !== ''),
    replyMailFrom: z
      .string()
      .min(1)
      .refine((value) => value.trim() !== ''),
    replyMailPurpose: z
      .string()
      .min(1)
      .refine((value) => value.trim() !== ''),
    receivedMailText: z.string().optional(),
    receivedMailFiles: z
      .array(
        z.object({
          name: z.string(),
          type: z.string(),
          size: z.number(),
        })
      )
      .optional()
      .refine(
        (files) => !files || files.every((file) => file.size <= MAX_FILE_SIZE),
        `ファイルサイズは最大${MAX_FILE_SIZE / (1024 * 1024)}MBです`
      ),
    // .refine(
    //   (files) => Array.from(files!).every((file) => ACCEPTED_FILE_TYPES.includes(file.type)),
    //   `許可されていないファイル形式です`
    // ),
    replyMailContent: z
      .string()
      .min(1)
      .refine((value) => value.trim() !== ''),
    replyMailConsiderations: z.string().optional(),
  })
  .superRefine(({ receivedMailText, receivedMailFiles, activeTab }, ctx) => {
    if (activeTab === 'direct-input' && !receivedMailText?.trim()) {
      ctx.addIssue({
        path: ['receivedMailText'],
        code: z.ZodIssueCode.too_small,
        minimum: 1,
        type: 'string',
        inclusive: false,
      });
    }
    if (activeTab === 'file-upload' && (!receivedMailFiles || receivedMailFiles.length <= 0)) {
      ctx.addIssue({
        path: ['receivedMailFiles'],
        code: z.ZodIssueCode.too_small,
        minimum: 1,
        type: 'array',
        inclusive: false,
        message: 'ファイルを選択してください',
      });
    }
  });
export const modifyMailSchema = z.object({
  createdSubject: z.string().min(1),
  createdContent: z.string().min(1),
  modify: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
});

export type CreateNewMailSchema = z.infer<typeof createNewMailSchema>;
export type CreateReplyMailSchema = z.infer<typeof createReplyMailSchema>;
export type ModifyMailSchema = z.infer<typeof modifyMailSchema>;
