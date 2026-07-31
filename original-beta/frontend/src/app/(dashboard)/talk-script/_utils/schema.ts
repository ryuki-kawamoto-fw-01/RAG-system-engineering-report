import * as z from 'zod';

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export const ALLOWED_FILE_TYPES = {
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
};

export interface FileReference {
  name: string;
  type: string;
  size: number;
}

interface FileListLike extends Iterable<File> {
  length: number;
  [index: number]: File;
}

export const talkScriptSchema = z.object({
  files: z
    .union([z.array(z.custom<FileReference>()), z.custom<FileListLike>()])
    .refine((files) => {
      if (Array.isArray(files)) {
        return files.length > 0;
      }
      // FileListの場合（クライアントサイド）
      return files && typeof files === 'object' && 'length' in files && files.length > 0;
    }, 'ファイルを選択してください')
    .refine(
      (files) => {
        if (Array.isArray(files)) {
          return files.every((file) => file.size <= MAX_FILE_SIZE);
        }
        // FileListの場合（クライアントサイド）
        if (files && typeof files === 'object' && 'length' in files) {
          return Array.from(files as FileListLike).every((file) => file.size <= MAX_FILE_SIZE);
        }
        return true;
      },
      `ファイルサイズは最大${MAX_FILE_SIZE / (1024 * 1024)}MBです`
    )
    .refine((files) => {
      if (Array.isArray(files)) {
        return true; // 既にFileReferenceの配列の場合はチェック不要
      }
      // FileListの場合（クライアントサイド）
      if (files && typeof files === 'object' && 'length' in files) {
        return Array.from(files as FileListLike).every((file) => {
          const allowedTypes = Object.keys(ALLOWED_FILE_TYPES);
          return allowedTypes.includes(file.type);
        });
      }
      return true;
    }, `許可されていないファイル形式です`),
  purpose: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  partnerCharacteristics: z.array(z.number().min(0).max(100)).length(3),
  considerations: z.string().optional(),
});

export const modifiedTalkScriptSchema = z.object({
  modify: z
    .string()
    .min(1)
    .refine((value) => value.trim() !== ''),
  result: z.string().min(1),
});

export type TalkScriptSchema = z.infer<typeof talkScriptSchema>;
export type ModifiedTalkScriptSchema = z.infer<typeof modifiedTalkScriptSchema>;
