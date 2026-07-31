import { z } from 'zod';
import { MODEL_VALUES } from '../../../../../../config';

export const SettingFormSchema = z.object({
  model: z.enum(MODEL_VALUES, {
    message: '許可されたモデルを選択してください',
  }),
});
