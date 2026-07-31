import { z } from 'zod';
import { getExtension } from '@/app/_utils/file';
import { getMessage } from '@/app/_utils/message';
import {
  DOCUMENT_REGISTER_EXTENSIONS,
  INVALID_FILENAME_CHARACTERS,
  MAX_FILENAME_LENGTH,
} from '../_util/constant';

export const fileSchema = z
  .string()
  .trim()
  .min(1, getMessage('E_F_00230', 'ファイル名'))
  .max(MAX_FILENAME_LENGTH, getMessage('E_F_00280', 'ファイル名', String(MAX_FILENAME_LENGTH)))
  .regex(new RegExp(`^[^${INVALID_FILENAME_CHARACTERS}]+$`), getMessage('E_F_00290', 'ファイル名'))
  .refine((name) => !name.startsWith('.'), getMessage('E_F_00300', 'ファイル名'))
  .refine(
    (name) => {
      const extension = getExtension(name);
      return DOCUMENT_REGISTER_EXTENSIONS.includes(extension); // 許可された拡張子かチェック
    },
    {
      message: getMessage('E_F_00310'),
    }
  );
