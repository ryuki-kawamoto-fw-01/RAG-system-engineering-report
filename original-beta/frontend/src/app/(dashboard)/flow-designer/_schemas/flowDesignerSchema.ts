import { z } from 'zod';

export const flowDesignerSchema = z.object({
  text: z.string().min(1, '製造工程の詳細を入力してください'),
  type: z.string().min(1, '工程管理表の種類を選択してください'),
  consideration: z.string().optional(),
});

export type FlowDesignerFormData = z.infer<typeof flowDesignerSchema>;
