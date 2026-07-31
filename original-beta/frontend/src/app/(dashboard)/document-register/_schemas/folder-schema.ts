import { z } from 'zod';
import { getMessage } from '@/app/_utils/message';
import { INVALID_FOLDERNAME_CHARACTERS, MAX_FOLDERNAME_LENGTH } from '../_util/constant';

export const folderSchema = z
  .string()
  .trim()
  .min(1, getMessage('E_F_00230', 'フォルダ名'))
  .max(MAX_FOLDERNAME_LENGTH, getMessage('E_F_00280', 'フォルダ名', String(MAX_FOLDERNAME_LENGTH)))
  .regex(
    new RegExp(`^[^${INVALID_FOLDERNAME_CHARACTERS}]+$`),
    getMessage('E_F_00290', 'フォルダ名')
  )
  .refine((name) => !name.startsWith('.'), getMessage('E_F_00300', 'フォルダ名'));
